import { useMemo, useState } from 'react';
import Card from 'tdesign-react/es/card';
import Button from 'tdesign-react/es/button';
import Select from 'tdesign-react/es/select';
import Upload from 'tdesign-react/es/upload';
import Tag from 'tdesign-react/es/tag';
import Space from 'tdesign-react/es/space';
import {
  executeDataImport,
  parseDataImportExcel,
  type DataImportMode,
  type DataImportParseResult,
  type DataImportType,
} from '../lib/api';
import { DataTable, type Column } from '../components/data-table';
import { toast } from '../lib/toast';

const TYPE_OPTIONS: Array<{ value: DataImportType; label: string }> = [
  { value: 'ingredient', label: '食材' },
  { value: 'dish', label: '菜品' },
];

const MODE_OPTIONS: Array<{ value: DataImportMode; label: string }> = [
  { value: 'merge', label: '合并' },
  { value: 'replace', label: '替换' },
  { value: 'skip_duplicate', label: '跳过重复' },
];

const PREVIEW_COLUMNS: Column<DataImportParseResult['items'][0]>[] = [
  { colKey: 'index', title: '序号', cell: ({ row }) => row.index + 1 },
  { colKey: 'status', title: '状态', cell: ({ row }) => row.status === 'valid' ? '有效' : '无效' },
  { colKey: 'errors', title: '错误信息', cell: ({ row }) => row.errors?.join('；') || '无' },
  { colKey: 'item', title: '内容', cell: ({ row }) => JSON.stringify(row.item) },
];

export function DataImportPage() {
  const [type, setType] = useState<DataImportType>('ingredient');
  const [mode, setMode] = useState<DataImportMode>('merge');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<DataImportParseResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [executing, setExecuting] = useState(false);

  async function handleParse() {
    if (!file) {
      toast.warning('请先上传 Excel 文件');
      return;
    }
    setBusy(true);
    setPreview(null);
    try {
      const result = await parseDataImportExcel(file, type, mode);
      setPreview(result);
      toast.success('解析完成，可以继续执行导入。');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '解析导入内容失败');
    } finally {
      setBusy(false);
    }
  }

  async function handleExecute() {
    if (!preview) return;
    setExecuting(true);
    try {
      const result = await executeDataImport({
        type,
        mode,
        items: preview.items.map((i) => i.item),
      });
      toast.success(`导入完成：新增 ${result.created} 条，更新 ${result.updated} 条，跳过 ${result.skipped} 条。`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '执行导入失败');
    } finally {
      setExecuting(false);
    }
  }

  const validCount = preview?.validCount ?? 0;
  const invalidCount = preview?.invalidCount ?? 0;

  return (
    <div className="page-stack">
      <Card title="数据导入" subtitle="上传 Excel 文件批量导入食材或菜品数据"
        actions={
          <Space>
            <Button variant="outline" onClick={handleParse} loading={busy} disabled={busy || !file}>预览解析</Button>
            <Button theme="primary" onClick={handleExecute} loading={executing} disabled={executing || !preview}>执行导入</Button>
          </Space>
        } bordered>

        <div className="grid-form">
          <label>
            <span className="detail-label">导入类型</span>
            <Select value={type} onChange={(v) => { setType(v as DataImportType); setPreview(null); }} options={TYPE_OPTIONS} clearable={false} />
          </label>
          <label>
            <span className="detail-label">导入模式</span>
            <Select value={mode} onChange={(v) => setMode(v as DataImportMode)} options={MODE_OPTIONS} clearable={false} />
          </label>
        </div>

        <div className="inline-grid inline-grid-1" style={{ marginTop: 16 }}>
          <label>
            <span className="detail-label">Excel 文件</span>
            <Upload
              accept=".xlsx,.xls"
              autoUpload={false}
              files={file ? [{ name: file.name, size: file.size, status: 'done' } as any] : []}
              onChange={(val) => {
                const f = val?.[0]?.raw ?? null;
                setFile(f);
                setPreview(null);
              }}
              theme="file"
              tips="支持 .xlsx / .xls 格式，表头需包含英文字段名或中文字段名"
            />
          </label>
        </div>
      </Card>

      <Card title="解析预览" subtitle="校验结果与待导入记录"
        actions={preview ? <Tag theme="default">有效 {validCount} / 无效 {invalidCount}</Tag> : undefined} bordered>
        {!preview ? (
          <p className="muted">请先上传 Excel 文件并执行预览解析。</p>
        ) : (
          <>
            <div className="detail-grid">
              <div>
                <span className="detail-label">总记录数</span>
                <strong>{preview.total}</strong>
              </div>
              <div>
                <span className="detail-label">有效记录</span>
                <strong>{validCount}</strong>
              </div>
            </div>

            <DataTable
              columns={PREVIEW_COLUMNS}
              data={preview.items}
              rowKey="index"
              showPagination={false}
              emptyText="暂无预览数据"
            />
          </>
        )}
      </Card>
    </div>
  );
}
