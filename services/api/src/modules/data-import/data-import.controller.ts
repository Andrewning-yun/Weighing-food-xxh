import { Body, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../user/user.entity';
import { DataImportService } from './data-import.service';
import { DataImportMode, DataImportType, ExecuteDataImportDto } from './dto/data-import.dto';

interface UploadedFilePayload {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Controller('data-import')
@UseGuards(AuthGuard)
export class DataImportController {
  constructor(private readonly dataImportService: DataImportService) {}

  @Post('parse')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  parse(
    @UploadedFile() file: UploadedFilePayload,
    @Body('type') type: DataImportType,
    @Body('mode') mode: DataImportMode,
  ) {
    return this.dataImportService.parseExcel(file.buffer, type, mode);
  }

  @Post('execute')
  @Roles(UserRole.ADMIN)
  execute(@Body() dto: ExecuteDataImportDto) {
    return this.dataImportService.execute(dto);
  }
}
