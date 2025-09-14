import React, { ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string;
  accessor?: keyof T | ((item: T) => any);
  render?: (value: any, item: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function Table<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  className = '',
}: TableProps<T>) {
  const getValue = (item: T, accessor: keyof T | ((item: T) => any)) => {
    if (typeof accessor === 'function') {
      return accessor(item);
    }
    return item[accessor];
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-6 py-4 border-b border-gray-200">
              <div className="flex space-x-4">
                <div className="h-4 bg-gray-300 rounded flex-1"></div>
                <div className="h-4 bg-gray-300 rounded flex-1"></div>
                <div className="h-4 bg-gray-300 rounded flex-1"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="table">
          <thead className="table-header">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`table-header-cell ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={index}
                  className={`${
                    onRowClick
                      ? 'cursor-pointer hover:bg-gray-50 transition-colors duration-200'
                      : ''
                  }`}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => {
                    const value = column.accessor
                      ? getValue(item, column.accessor)
                      : item[column.key];
                    
                    return (
                      <td
                        key={column.key}
                        className={`table-cell ${column.className || ''}`}
                      >
                        {column.render ? column.render(value, item) : value}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}