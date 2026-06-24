import { useMemo, useState } from 'react';
import useSWR from 'swr';
import Card from 'tdesign-react/es/card';
import Select from 'tdesign-react/es/select';
import Table from 'tdesign-react/es/table';
import Tag from 'tdesign-react/es/tag';
import {
  fetchStores,
  listInventories,
  type InventoryItem,
  type InventoryRecord,
} from '../lib/api';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function getItemName(item: InventoryItem) {
  return item.ingredientName || item.name || item.ingredientId;
}

function getItemCategory(item: InventoryItem) {
  return item.category || 'other';
}

export function InventoryPage() {
  const { data: stores = [] } = useSWR('inventory-stores', fetchStores);
  const [queryStoreId, setQueryStoreId] = useState('');
  const [queryDate, setQueryDate] = useState(today());

  // Set initial store
  if (!queryStoreId && stores.length > 0) {
    setQueryStoreId(stores[0].id);
  }

  const { data: inventory, isLoading } = useSWR(
    queryStoreId ? ['inventory', queryStoreId, queryDate] : null,
    () => listInventories({ storeId: queryStoreId, date: queryDate }).then(r => r[0] || null),
  );

  const groupedItems = useMemo(() => {
    const grouped = new Map<string, InventoryItem[]>();
    (inventory?.items || []).forEach((item) => {
      const category = getItemCategory(item);
      const current = grouped.get(category) || [];
      current.push(item);
      grouped.set(category, current);
    });

    return Array.from(grouped.entries()).map(([category, items]) => ({
      category,
      items: [...items].sort((left, right) => getItemName(left).localeCompare(getItemName(right))),
    }));
  }, [inventory]);

  const totalQuantity = useMemo(
    () => (inventory?.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [inventory],
  );

  const activeStore = stores.find((store) => store.id === queryStoreId) || null;

  const storeOptions = stores.map((store) => ({ value: store.id, label: store.name }));

  return (
    <div className="page-stack">
      <Card title="库存查看" subtitle="按门店和日期查看每日库存快照。"
        actions={<Tag theme="default">{inventory?.items?.length || 0} 项</Tag>} bordered>

        <div className="grid-form">
          <label>
            <span>门店</span>
            <Select value={queryStoreId} onChange={(v) => setQueryStoreId(v as string)} options={storeOptions} placeholder="选择门店" clearable={false} />
          </label>
          <label>
            <span>日期</span>
            <input type="date" value={queryDate} onChange={(event) => setQueryDate(event.target.value)}
              style={{ width: '100%', borderRadius: 'var(--td-radius-default, 6px)', border: '1px solid var(--td-component-border)', padding: '5px 8px', height: 32, fontSize: '0.9rem', background: 'var(--td-bg-color-container)' }} />
          </label>
        </div>

        <div className="detail-grid">
          <div>
            <span className="detail-label">门店</span>
            <strong>{activeStore?.name || queryStoreId || '未选择'}</strong>
          </div>
          <div>
            <span className="detail-label">提交日期</span>
            <strong>{inventory?.date || queryDate}</strong>
          </div>
          <div>
            <span className="detail-label">填报人</span>
            <strong>{inventory?.reporterName || inventory?.reportedBy || inventory?.reporterId || '-'}</strong>
          </div>
          <div>
            <span className="detail-label">总数量</span>
            <strong>{totalQuantity}</strong>
          </div>
        </div>
      </Card>

      <Card title="库存明细" subtitle="分组食材快照（只读）" bordered>
        {isLoading ? (
          <p className="muted">正在加载库存...</p>
        ) : groupedItems.length === 0 ? (
          <p className="muted">当前筛选条件下没有库存记录。</p>
        ) : (
          <div className="stack-list">
            {groupedItems.map((group) => (
              <div key={group.category} className="nested-card">
                <div className="row-split">
                  <strong>{group.category}</strong>
                  <Tag theme="default">{group.items.length} 项</Tag>
                </div>

                <Table
                  data={group.items}
                  columns={[
                    { colKey: 'name', title: '食材', cell: ({ row }) => getItemName(row as InventoryItem) },
                    { colKey: 'quantity', title: '数量' },
                    { colKey: 'unit', title: '单位' },
                    { colKey: 'perishable', title: '易腐', cell: ({ row }) => (row as InventoryItem).perishable ? '是' : '否' },
                  ]}
                  rowKey="ingredientId"
                  size="small"
                  resizable
                  hover
                  stripe
                />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
