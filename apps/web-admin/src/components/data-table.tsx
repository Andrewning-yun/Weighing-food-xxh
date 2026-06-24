'use client';

import { type ReactNode, useState, useMemo, useCallback } from 'react';
import { Input } from 'tdesign-react/es/input';
import { Pagination } from 'tdesign-react/es/pagination';
import { Table } from 'tdesign-react/es/table';
import { Loading } from 'tdesign-react/es/loading';
import { Button } from 'tdesign-react/es/button';
import { SearchIcon, RefreshIcon } from 'tdesign-icons-react';

export type SortDirection = 'asc' | 'desc';

export interface Column<T> {
  colKey: string;
  title: string;
  width?: number | string;
  cell?: (props: { row: T; rowIndex: number }) => ReactNode;
  searchable?: boolean;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: Error | string | null;
  rowKey?: string;
  searchPlaceholder?: string;
  pageSize?: number;
  emptyText?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  onRowClick?: (row: T) => void;
  showPagination?: boolean;
  onRefresh?: () => void;
  onSearch?: (keyword: string) => void;
  /** External sort state */
  sortBy?: string;
  sortDirection?: SortDirection;
  onSortChange?: (colKey: string, direction: SortDirection) => void;
}

function EmptyContent({
  text,
  description,
  icon,
}: {
  text: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '12px', opacity: 0.35 }}>
        {icon || '📋'}
      </div>
      <div
        style={{
          fontSize: '0.95rem',
          color: 'var(--td-text-color-secondary)',
          marginBottom: '4px',
        }}
      >
        {text}
      </div>
      {description && (
        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--td-text-color-placeholder)',
          }}
        >
          {description}
        </div>
      )}
    </div>
  );
}

function ErrorContent({
  error,
  onRetry,
}: {
  error: Error | string;
  onRetry?: () => void;
}) {
  const message = typeof error === 'string' ? error : error.message;
  return (
    <div role="alert" style={{ textAlign: 'center', padding: '48px 0' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '12px', opacity: 0.35 }}>⚠</div>
      <div
        style={{
          fontSize: '0.95rem',
          color: 'var(--td-error-color)',
          marginBottom: '4px',
        }}
      >
        数据加载失败
      </div>
      <div
        style={{
          fontSize: '0.8rem',
          color: 'var(--td-text-color-placeholder)',
          marginBottom: '12px',
        }}
      >
        {message}
      </div>
      {onRetry && (
        <Button
          size="small"
          variant="outline"
          icon={<RefreshIcon />}
          onClick={onRetry}
        >
          重试
        </Button>
      )}
    </div>
  );
}

export function DataTable<T extends object>({
  columns,
  data,
  loading = false,
  error = null,
  rowKey = 'id',
  searchPlaceholder = '搜索...',
  pageSize = 10,
  emptyText = '暂无数据',
  emptyDescription,
  emptyIcon,
  onRowClick,
  showPagination = true,
  onRefresh,
  onSearch,
  sortBy,
  sortDirection,
  onSortChange,
}: DataTableProps<T>) {
  const [localSearch, setLocalSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [localSortBy, setLocalSortBy] = useState<string | undefined>(sortBy);
  const [localSortDir, setLocalSortDir] = useState<SortDirection | undefined>(sortDirection);

  // Use external sort state if provided, otherwise local
  const activeSortBy = sortBy ?? localSortBy;
  const activeSortDir = sortDirection ?? localSortDir;

  const searchableColumns = useMemo(
    () => columns.filter((col) => col.searchable).map((col) => col.colKey),
    [columns],
  );

  const filteredData = useMemo(() => {
    let result = data;

    // Client-side search filter
    if (localSearch.trim() && searchableColumns.length > 0 && !onSearch) {
      const lower = localSearch.toLowerCase();
      result = result.filter((row) =>
        searchableColumns.some((key) => {
          const value = row[key];
          return value != null && String(value).toLowerCase().includes(lower);
        }),
      );
    }

    // Client-side sort
    if (activeSortBy && activeSortDir) {
      result = [...result].sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[activeSortBy];
        const bVal = (b as Record<string, unknown>)[activeSortBy];
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const cmp = typeof aVal === 'number'
          ? aVal - (bVal as number)
          : String(aVal).localeCompare(String(bVal));
        return activeSortDir === 'desc' ? -cmp : cmp;
      });
    }

    return result;
  }, [data, localSearch, searchableColumns, onSearch, activeSortBy, activeSortDir]);

  const paginatedData = useMemo(() => {
    if (!showPagination) return filteredData;
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize, showPagination]);

  const handleSortChange = useCallback(
    ({ sortBy: colKey, descending }: { sortBy: string; descending: boolean }) => {
      const dir: SortDirection = descending ? 'desc' : 'asc';
      if (onSortChange) {
        onSortChange(colKey, dir);
      } else {
        setLocalSortBy(colKey);
        setLocalSortDir(dir);
      }
    },
    [onSortChange],
  );

  const tableColumns = useMemo(
    () =>
      columns.map((col) => ({
        colKey: col.colKey,
        title: col.title,
        width: columnWidths[col.colKey] || col.width,
        cell: col.cell,
        resizable: true,
        align: col.align,
        sortable: col.sortable,
        sorter: col.sortable,
      })),
    [columns, columnWidths],
  );

  const handleColumnResize = useCallback(
    ({ columnsWidth }: { columnsWidth: Record<string, number> }) => {
      setColumnWidths((prev) => ({ ...prev, ...columnsWidth }));
    },
    [],
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleSearchChange = useCallback(
    (value: string) => {
      setLocalSearch(value);
      setCurrentPage(1);
      onSearch?.(value);
    },
    [onSearch],
  );

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {/* Toolbar: Search + Refresh */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        {searchableColumns.length > 0 && (
          <div style={{ maxWidth: 360, flex: 1 }}>
            <Input
              value={localSearch}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              prefixIcon={<SearchIcon />}
              clearable
            />
          </div>
        )}
        {onRefresh && (
          <Button
            variant="text"
            shape="square"
            icon={<RefreshIcon />}
            onClick={onRefresh}
            aria-label="刷新数据"
          />
        )}
      </div>

      {/* Loading / Error / Empty */}
      <Loading loading={loading} text="加载中...">
        {error ? (
          <ErrorContent error={error} onRetry={onRefresh} />
        ) : (
          <Table
            data={paginatedData as Record<string, unknown>[]}
            columns={tableColumns as any}
            rowKey={rowKey}
            bordered
            stripe
            hover
            size="medium"
            resizable
            sort={activeSortBy ? { sortBy: activeSortBy, descending: activeSortDir === 'desc' } : undefined}
            onColumnResizeChange={handleColumnResize}
            onSortChange={handleSortChange}
            empty={
              <EmptyContent
                text={emptyText}
                description={emptyDescription}
                icon={emptyIcon}
              />
            }
            onRowClick={
              onRowClick
                ? ({ row }) => onRowClick(row as T)
                : undefined
            }
            tableLayout="auto"
          />
        )}
      </Loading>

      {/* Pagination */}
      {showPagination && !error && filteredData.length > pageSize && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Pagination
            current={currentPage}
            total={filteredData.length}
            pageSize={pageSize}
            onChange={(pageInfo) => handlePageChange(pageInfo.current)}
            showJumper
          />
        </div>
      )}

      {/* Record count */}
      {!loading && !error && filteredData.length > 0 && (
        <div
          style={{
            fontSize: '0.78rem',
            color: 'var(--td-text-color-placeholder)',
            textAlign: 'right',
          }}
        >
          共 {filteredData.length} 条记录
          {filteredData.length !== data.length &&
            `（筛选自 ${data.length} 条）`}
        </div>
      )}
    </div>
  );
}
