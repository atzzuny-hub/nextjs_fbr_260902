import { columnFilteringFeature, createExpandedRowModel, createFilteredRowModel, createPaginatedRowModel, filterFn_includesString, globalFilteringFeature, rowExpandingFeature, rowPaginationFeature, tableFeatures } from "@tanstack/react-table";

export const features = tableFeatures({
    rowExpandingFeature,
    expandedRowModel:createExpandedRowModel(),
    rowPaginationFeature,
    paginatedRowModel: createPaginatedRowModel(),  
    columnFilteringFeature,                                  // 전역 필터의 전제조건
    globalFilteringFeature,
    filteredRowModel: createFilteredRowModel(),
    filterFns: { includesString: filterFn_includesString },
})
export type DataTableFeatures = typeof features