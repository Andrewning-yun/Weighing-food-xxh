import 'reflect-metadata';
import assert = require('node:assert/strict');
import { after, before, test } from 'node:test';
import {
  Controller,
  Get,
  Injectable,
  Module,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { AuthController } from '../auth/auth.controller';
import { AuthGuard } from '../auth/auth.guard';
import { AuthService } from '../auth/auth.service';
import { DishController } from '../dish/dish.controller';
import { CreateDishDto } from '../dish/dto/create-dish.dto';
import { UpdateDishDto } from '../dish/dto/update-dish.dto';
import { DishCategory, Station } from '../dish/dish.entity';
import { DishService } from '../dish/dish.service';
import { CreateIngredientDto } from '../ingredient/dto/create-ingredient.dto';
import { UpdateIngredientDto } from '../ingredient/dto/update-ingredient.dto';
import { IngredientController } from '../ingredient/ingredient.controller';
import { IngredientService } from '../ingredient/ingredient.service';
import { CreateStoreDto } from '../store/dto/create-store.dto';
import { UpdateStoreDto } from '../store/dto/update-store.dto';
import { StoreController } from '../store/store.controller';
import { StoreService } from '../store/store.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UpdateUserDto } from '../user/dto/update-user.dto';
import { UserController } from '../user/user.controller';
import { UserRole } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { calculateIngredientCost, estimateGrossMargin } from './costing.utils';

@Injectable()
class DishServiceMock {
  private readonly items = new Map<string, DishRecord>();

  create(createDishDto: CreateDishDto) {
    const id = `dish-${this.items.size + 1}`;
    const item: DishRecord = {
      id,
      name: createDishDto.name,
      category: createDishDto.category,
      station: createDishDto.station,
      description: createDishDto.description,
      ingredients: createDishDto.ingredients || [],
      steps: createDishDto.steps || [],
      ingredientCost: 0,
      isActive: createDishDto.isActive ?? true,
    };

    this.items.set(id, item);
    return item;
  }

  findAll() {
    return [...this.items.values()];
  }

  findOne(id: string) {
    const item = this.items.get(id);
    if (!item) {
      throw new NotFoundException('Dish not found');
    }

    return item;
  }

  update(id: string, updateDishDto: UpdateDishDto) {
    const current = this.findOne(id);
    const updated = {
      ...current,
      ...updateDishDto,
    };
    this.items.set(id, updated);
    return updated;
  }

  remove(id: string) {
    this.findOne(id);
    this.items.delete(id);
    return { id };
  }
}

@Injectable()
class HttpAuthServiceMockLocal {
  private readonly tokenByUsername = new Map<string, string>();

  async login(username: string, password: string) {
    if (username !== 'admin' || password !== 'secret') {
      throw new UnauthorizedException('Invalid username or password');
    }

    const token =
      this.tokenByUsername.get(username) ||
      jwt.sign(
        {
          sub: 'user-admin',
          username,
          role: UserRole.ADMIN,
          storeId: 'store-1',
        },
        'dev-secret',
      );
    this.tokenByUsername.set(username, token);

    return {
      token,
      user: {
        id: 'user-admin',
        username,
        name: 'Admin User',
        role: UserRole.ADMIN,
        storeId: 'store-1',
        storeName: 'Downtown Flagship',
      } satisfies AuthProfile,
    };
  }

  async me(userId: string) {
    if (userId !== 'user-admin') {
      throw new Error('User not found');
    }

    return {
      id: 'user-admin',
      username: 'admin',
      name: 'Admin User',
      role: UserRole.ADMIN,
      storeId: 'store-1',
      storeName: 'Downtown Flagship',
    } satisfies AuthProfile;
  }
}

@Injectable()
class IngredientServiceMockLocal {
  private readonly items = new Map<string, IngredientRecord>();

  create(createIngredientDto: CreateIngredientDto) {
    const id = `ingredient-${this.items.size + 1}`;
    const item: IngredientRecord = {
      id,
      name: createIngredientDto.name,
      unit: createIngredientDto.unit,
      price: createIngredientDto.price,
      costPerUnit: createIngredientDto.costPerUnit ?? createIngredientDto.price,
      supplier: createIngredientDto.supplier,
      spec: createIngredientDto.spec,
      isActive: createIngredientDto.isActive ?? true,
    };

    this.items.set(id, item);
    return item;
  }

  findAll() {
    return [...this.items.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  findOne(id: string) {
    const item = this.items.get(id);
    if (!item) {
      throw new NotFoundException('Ingredient not found');
    }

    return item;
  }

  update(id: string, updateIngredientDto: UpdateIngredientDto) {
    const current = this.findOne(id);
    const updated = {
      ...current,
      ...updateIngredientDto,
    };
    this.items.set(id, updated);
    return updated;
  }

  remove(id: string) {
    this.findOne(id);
    this.items.delete(id);
    return { id };
  }
}

@Injectable()
class UserServiceMockLocal {
  private readonly items = new Map<string, UserRecord>();

  create(createUserDto: CreateUserDto) {
    const id = `user-${this.items.size + 1}`;
    const item: UserRecord = {
      id,
      username: createUserDto.username,
      name: createUserDto.name,
      role: createUserDto.role ?? UserRole.CHEF,
      storeId: createUserDto.storeId,
      wechatOpenId: createUserDto.wechatOpenId,
    };

    this.items.set(id, item);
    return item;
  }

  findAll() {
    return [...this.items.values()];
  }

  findOne(id: string) {
    const item = this.items.get(id);
    if (!item) {
      throw new NotFoundException('User not found');
    }

    return item;
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    const current = this.findOne(id);
    const updated = {
      ...current,
      username: updateUserDto.username ?? current.username,
      name: updateUserDto.name ?? current.name,
      role: updateUserDto.role ?? current.role,
      storeId: updateUserDto.storeId ?? current.storeId,
      wechatOpenId: updateUserDto.wechatOpenId ?? current.wechatOpenId,
    };
    this.items.set(id, updated);
    return updated;
  }

  remove(id: string) {
    this.findOne(id);
    this.items.delete(id);
    return { id };
  }
}

@Injectable()
class StoreServiceMockLocal {
  private readonly items = new Map<string, StoreRecord>();

  create(createStoreDto: CreateStoreDto) {
    const id = `store-${this.items.size + 1}`;
    const item: StoreRecord = {
      id,
      name: createStoreDto.name,
      address: createStoreDto.address,
      brandId: createStoreDto.brandId,
      isActive: createStoreDto.isActive ?? true,
      contactName: createStoreDto.contactName,
      contactPhone: createStoreDto.contactPhone,
    };

    this.items.set(id, item);
    return item;
  }

  findAll() {
    return [...this.items.values()];
  }

  findOne(id: string) {
    const item = this.items.get(id);
    if (!item) {
      throw new NotFoundException('Store not found');
    }

    return item;
  }

  update(id: string, updateStoreDto: UpdateStoreDto) {
    const current = this.findOne(id);
    const updated = {
      ...current,
      ...updateStoreDto,
    };
    this.items.set(id, updated);
    return updated;
  }

  remove(id: string) {
    this.findOne(id);
    this.items.delete(id);
    return { id };
  }
}

@Controller()
class RootControllerLocal {
  @Get('health')
  health() {
    return { ok: true };
  }
}

@Module({
  controllers: [
    RootControllerLocal,
    AuthController,
    IngredientController,
    DishController,
    UserController,
    StoreController,
  ],
  providers: [
    AuthGuard,
    { provide: AuthService, useClass: HttpAuthServiceMockLocal },
    { provide: IngredientService, useClass: IngredientServiceMockLocal },
    { provide: DishService, useClass: DishServiceMock },
    { provide: UserService, useClass: UserServiceMockLocal },
    { provide: StoreService, useClass: StoreServiceMockLocal },
  ],
})
class HttpIntegrationTestModuleLocal {}

type AuthProfile = {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  storeId?: string;
  storeName?: string;
};

type IngredientRecord = {
  id: string;
  name: string;
  unit: string;
  price: number;
  costPerUnit?: number;
  supplier?: string;
  spec?: string;
  isActive: boolean;
};

type DishRecord = {
  id: string;
  name: string;
  category: DishCategory;
  station: Station;
  description?: string;
  ingredients: Array<{ ingredientId: string; quantity: number; unit: string; wasteRate: number }>;
  steps: Array<{ id: number; title: string; description: string; duration?: number; station?: string }>;
  ingredientCost: number;
  isActive: boolean;
};

type UserRecord = {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  storeId?: string;
  wechatOpenId?: string;
};

type StoreRecord = {
  id: string;
  name: string;
  address?: string;
  brandId: string;
  isActive: boolean;
  contactName?: string;
  contactPhone?: string;
};

let app: Awaited<ReturnType<typeof NestFactory.create>> | null = null;
let baseUrl = '';
let token = '';
let createdIngredientId = '';
let createdDishId = '';
let createdUserId = '';
let createdStoreId = '';

before(async () => {
  app = await NestFactory.create(HttpIntegrationTestModuleLocal, { logger: false });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  await app.listen(0);
  baseUrl = await app.getUrl();
});

after(async () => {
  if (app) {
    await app.close();
  }
});

async function httpJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  return {
    status: response.status,
    body: (await response.json()) as T,
  };
}

test('auth login returns token and me resolves the profile', async () => {
  const login = await httpJson<{
    success: boolean;
    data: { token: string; user: AuthProfile };
  }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'admin', password: 'secret' }),
  });

  assert.equal(login.status, 201);
  assert.equal(login.body.success, true);
  assert.equal(login.body.data.user.username, 'admin');
  assert.equal(login.body.data.user.role, UserRole.ADMIN);

  token = login.body.data.token;

  const me = await httpJson<{
    success: boolean;
    data: AuthProfile;
  }>('/api/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(me.status, 200);
  assert.equal(me.body.success, true);
  assert.equal(me.body.data.id, 'user-admin');
  assert.equal(me.body.data.storeId, 'store-1');
  assert.equal(me.body.data.storeName, 'Downtown Flagship');
});

test('auth login rejects invalid credentials', async () => {
  const login = await httpJson<{ success: boolean; message?: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'admin', password: 'wrong-password' }),
  });

  assert.equal(login.status, 401);
  assert.equal((login.body as { statusCode?: number }).statusCode, 401);
});

test('ingredients CRUD is reachable over HTTP', async () => {
  if (!token) {
    const login = await httpJson<{
      success: boolean;
      data: { token: string; user: AuthProfile };
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'secret' }),
    });
    token = login.body.data.token;
  }

  const created = await httpJson<{
    success: boolean;
    data: IngredientRecord;
  }>('/api/ingredients', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'Chicken Breast',
      unit: 'g',
      price: 18.5,
      supplier: 'Supplier A',
      spec: 'Fresh',
    }),
  });

  assert.equal(created.status, 201);
  assert.equal(created.body.success, true);
  assert.equal(created.body.data.name, 'Chicken Breast');
  createdIngredientId = created.body.data.id;

  const list = await httpJson<{
    success: boolean;
    data: IngredientRecord[];
  }>('/api/ingredients', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(list.status, 200);
  assert.equal(list.body.data.length, 1);
  assert.equal(list.body.data[0].id, createdIngredientId);

  const one = await httpJson<{
    success: boolean;
    data: IngredientRecord;
  }>(`/api/ingredients/${createdIngredientId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(one.status, 200);
  assert.equal(one.body.data.id, createdIngredientId);

  const updated = await httpJson<{
    success: boolean;
    data: IngredientRecord;
  }>(`/api/ingredients/${createdIngredientId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      price: 21,
      isActive: false,
    }),
  });

  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.price, 21);
  assert.equal(updated.body.data.isActive, false);

  const removed = await httpJson<{ success: boolean; data: { id: string } }>(
    `/api/ingredients/${createdIngredientId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  assert.equal(removed.status, 200);
  assert.equal(removed.body.data.id, createdIngredientId);
});

test('dishes CRUD is reachable over HTTP', async () => {
  if (!token) {
    const login = await httpJson<{
      success: boolean;
      data: { token: string; user: AuthProfile };
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'secret' }),
    });
    token = login.body.data.token;
  }

  const created = await httpJson<{
    success: boolean;
    data: DishRecord;
  }>('/api/dishes', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'Signature Rice Bowl',
      category: DishCategory.STEAM,
      station: Station.WOK,
      ingredients: [],
      steps: [],
    }),
  });

  assert.equal(created.status, 201);
  assert.equal(created.body.data.name, 'Signature Rice Bowl');
  createdDishId = created.body.data.id;

  const list = await httpJson<{
    success: boolean;
    data: DishRecord[];
  }>('/api/dishes', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(list.status, 200);
  assert.equal(list.body.data.length, 1);
  assert.equal(list.body.data[0].id, createdDishId);

  const one = await httpJson<{
    success: boolean;
    data: DishRecord;
  }>(`/api/dishes/${createdDishId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(one.status, 200);
  assert.equal(one.body.data.id, createdDishId);

  const updated = await httpJson<{
    success: boolean;
    data: DishRecord;
  }>(`/api/dishes/${createdDishId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      description: 'Updated from integration test',
      isActive: false,
    }),
  });

  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.description, 'Updated from integration test');
  assert.equal(updated.body.data.isActive, false);

  const removed = await httpJson<{ success: boolean; data: { id: string } }>(
    `/api/dishes/${createdDishId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  assert.equal(removed.status, 200);
  assert.equal(removed.body.data.id, createdDishId);
});

test('users CRUD is reachable over HTTP', async () => {
  if (!token) {
    const login = await httpJson<{
      success: boolean;
      data: { token: string; user: AuthProfile };
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'secret' }),
    });
    token = login.body.data.token;
  }

  const created = await httpJson<{
    success: boolean;
    data: UserRecord;
  }>('/api/users', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      username: 'chef-manager',
      password: 'secret1234',
      name: 'Chef Manager',
      role: UserRole.CHEF_MANAGER,
      storeId: 'store-1',
    }),
  });

  assert.equal(created.status, 201);
  assert.equal(created.body.data.username, 'chef-manager');
  createdUserId = created.body.data.id;

  const list = await httpJson<{
    success: boolean;
    data: UserRecord[];
  }>('/api/users', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(list.status, 200);
  assert.equal(list.body.data.length, 1);
  assert.equal(list.body.data[0].id, createdUserId);

  const updated = await httpJson<{
    success: boolean;
    data: UserRecord;
  }>(`/api/users/${createdUserId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'Updated Chef Manager',
    }),
  });

  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.name, 'Updated Chef Manager');

  const removed = await httpJson<{ success: boolean; data: { id: string } }>(
    `/api/users/${createdUserId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  assert.equal(removed.status, 200);
  assert.equal(removed.body.data.id, createdUserId);
});

test('stores CRUD is reachable over HTTP', async () => {
  if (!token) {
    const login = await httpJson<{
      success: boolean;
      data: { token: string; user: AuthProfile };
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'secret' }),
    });
    token = login.body.data.token;
  }

  const created = await httpJson<{
    success: boolean;
    data: StoreRecord;
  }>('/api/stores', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'Downtown Store',
      address: '100 Central Road',
      brandId: 'demo-brand',
      contactName: 'Store Lead',
      contactPhone: '18800001111',
    }),
  });

  assert.equal(created.status, 201);
  assert.equal(created.body.data.name, 'Downtown Store');
  createdStoreId = created.body.data.id;

  const list = await httpJson<{
    success: boolean;
    data: StoreRecord[];
  }>('/api/stores', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(list.status, 200);
  assert.equal(list.body.data.length, 1);
  assert.equal(list.body.data[0].id, createdStoreId);

  const updated = await httpJson<{
    success: boolean;
    data: StoreRecord;
  }>(`/api/stores/${createdStoreId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      contactName: 'Updated Lead',
      isActive: false,
    }),
  });

  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.contactName, 'Updated Lead');
  assert.equal(updated.body.data.isActive, false);

  const removed = await httpJson<{ success: boolean; data: { id: string } }>(
    `/api/stores/${createdStoreId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  assert.equal(removed.status, 200);
  assert.equal(removed.body.data.id, createdStoreId);
});

test('calculateIngredientCost applies waste rate', () => {
  assert.equal(calculateIngredientCost(2.5, 4, 0.1), 11);
});

test('calculateIngredientCost keeps two decimal precision', () => {
  assert.equal(calculateIngredientCost(0.333, 3, 0), 1);
});

test('estimateGrossMargin returns expected values', () => {
  const margin = estimateGrossMargin(12, 8, 2.5);
  assert.equal(margin > 0, true);
  assert.equal(margin < 1, true);
});

test('estimateGrossMargin returns default for zero price', () => {
  assert.equal(estimateGrossMargin(12, 0), 0.5);
});
