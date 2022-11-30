import { useCallback, useMemo } from 'react'
import {
  createColumnHelper,
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { TableState } from '@tanstack/react-table'
import { isEmpty, isBoolean } from 'lodash-es'
import { TableContext } from '~/context/table-context'
import { Column, TableProps } from '~/types/table'
import Thead from '~/thead'
import Tbody from '~/tbody'
import { Pagination } from '~/pagination'

import './table.css'
import { IndeterminateCheckbox } from '~/components/indeterminate-checkbox/indeterminate-checkbox'

function Table<T>(props: TableProps<T>) {
  const {
    data = [],
    columns,
    pagination = true,
    pageCount = -1,
    onPaginationChange,
    rowSelection,
  } = props
  const columnHelper = createColumnHelper<T>()

  const loopColumns = useCallback(
    (columns: Column<T>[]): any[] => {
      return columns.map((column) => {
        if (column.children) {
          return columnHelper.group({
            header: (column.title || column.dataIndex) as string,
            columns: loopColumns(column.children),
          })
        }
        // todo 这里的类型转换不太好
        return columnHelper.accessor(column.dataIndex as unknown as any, {
          header: column.title,
        })
      })
    },
    [columnHelper],
  )

  const tableColumns = useMemo<ColumnDef<T>[]>(() => loopColumns(columns), [columns, loopColumns])
  const tableColumnsWithOp = useMemo<ColumnDef<T>[]>(() => {
    if (rowSelection) {
      return [
        {
          id: 'select',
          header: ({ table }) => (
            <IndeterminateCheckbox
              {...{
                checked: table.getIsAllRowsSelected(),
                indeterminate: table.getIsSomeRowsSelected(),
                onChange: (e) => {
                  table.getToggleAllRowsSelectedHandler()(e)
                },
              }}
            />
          ),
          cell: ({ row }) => (
            <div className='px-1'>
              <IndeterminateCheckbox
                {...{
                  checked: row.getIsSelected(),
                  indeterminate: row.getIsSomeSelected(),
                  onChange: row.getToggleSelectedHandler(),
                }}
              />
            </div>
          ),
        },
        ...tableColumns,
      ]
    }
    return tableColumns
  }, [rowSelection, tableColumns])

  const tableState = useMemo(() => {
    const _state = {} as TableState
    if (!isBoolean(pagination)) {
      _state.pagination = pagination
    }
    return !isEmpty(_state) ? { state: _state } : undefined
  }, [pagination])

  const manualPaginationInfo = useMemo(() => {
    if (isBoolean(pagination)) {
      return undefined
    }
    return {
      pageCount,
      onPaginationChange,
      manualPagination: true,
    }
  }, [onPaginationChange, pageCount, pagination])

  const table = useReactTable<T>({
    columns: tableColumnsWithOp,
    data,
    ...tableState,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    ...manualPaginationInfo,
  })
  return (
    <div>
      <TableContext.Provider value={{ table: table }}>
        <table>
          <Thead<T> />
          <Tbody<T> />
        </table>
        {pagination && <Pagination />}
      </TableContext.Provider>
    </div>
  )
}

export default Table