import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';

const DataGrid = ({
  columns,
  data = [],
  onSort,
  sortable = true,
  initialSort = null,
  loading = false,
  pageSize = 10,
  onPageChange,
  currentPage = 1,
  totalPages,
  totalItems,
  emptyMessage = 'No data available',
  loadingMessage = 'Loading...',
  rowActions,
  className = '',
  stickyHeader = false,
  zebra = true,
  compact = false,
  selectable = false,
  selectedRows = [],
  onRowSelect,
  onSelectAll,
}) => {
  const [localSort, setLocalSort] = useState(initialSort);

  const handleSort = (column) => {
    if (!sortable || !column.sortable) return;

    let newSort;
    if (localSort?.field === column.field) {
      newSort = {
        field: column.field,
        direction: localSort.direction === 'asc' ? 'desc' : 'asc'
      };
    } else {
      newSort = {
        field: column.field,
        direction: 'asc'
      };
    }

    setLocalSort(newSort);
    if (onSort) {
      onSort(newSort);
    }
  };

  const getSortIcon = (column) => {
    if (!sortable || !column.sortable) return null;
    
    if (localSort?.field === column.field) {
      return localSort.direction === 'asc' ? 
        <ChevronUp className="w-4 h-4" /> : 
        <ChevronDown className="w-4 h-4" />;
    }
    return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
  };

  const renderCell = (row, column) => {
    if (column.render) {
      return column.render(row);
    }
    return row[column.field];
  };

  const isSelected = (row) => {
    return selectedRows?.some(selected => selected.id === row.id);
  };

  const toggleRow = (row) => {
    if (!onRowSelect) return;
    onRowSelect(row, !isSelected(row));
  };

  const allSelected = useMemo(() => {
    return data.length > 0 && data.every(row => isSelected(row));
  }, [data, selectedRows]);

  const handleSelectAll = () => {
    if (!onSelectAll) return;
    onSelectAll(!allSelected);
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className={`bg-gray-50 ${stickyHeader ? 'sticky top-0' : ''}`}>
          <tr>
            {selectable && (
              <th className="w-12 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
            )}
            {columns.map((column, index) => (
              <th
                key={column.field || index}
                className={`
                  ${compact ? 'px-3 py-2' : 'px-6 py-3'}
                  text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                  ${column.sortable ? 'cursor-pointer select-none' : ''}
                  ${column.className || ''}
                `}
                onClick={() => handleSort(column)}
              >
                <div className="flex items-center gap-1">
                  {column.header}
                  {column.sortable && getSortIcon(column)}
                </div>
              </th>
            ))}
            {rowActions && <th className="w-20"></th>}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loading ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                className="px-6 py-4 text-center text-sm text-gray-500"
              >
                {loadingMessage}
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                className="px-6 py-4 text-center text-sm text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                className={`
                  ${zebra ? (rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50') : 'bg-white'}
                  ${selectable ? 'cursor-pointer hover:bg-gray-50' : ''}
                  ${isSelected(row) ? 'bg-blue-50' : ''}
                `}
                onClick={selectable ? () => toggleRow(row) : undefined}
              >
                {selectable && (
                  <td className="w-12 px-3 py-4">
                    <input
                      type="checkbox"
                      checked={isSelected(row)}
                      onChange={(e) => e.stopPropagation()}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                )}
                {columns.map((column, colIndex) => (
                  <td
                    key={column.field || colIndex}
                    className={`
                      ${compact ? 'px-3 py-2' : 'px-6 py-4'}
                      text-sm text-gray-900
                      ${column.cellClassName || ''}
                    `}
                  >
                    {renderCell(row, column)}
                  </td>
                ))}
                {rowActions && (
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    {rowActions(row)}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, totalItems)}
                </span>{' '}
                of <span className="font-medium">{totalItems}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronDown className="h-5 w-5" aria-hidden="true" />
                </button>
                {/* Add page numbers here if needed */}
                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                >
                  <span className="sr-only">Next</span>
                  <ChevronUp className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataGrid;