import { columnFilteringFeature, columnSizingFeature, createExpandedRowModel, createFilteredRowModel, createPaginatedRowModel, filterFn_includesString, globalFilteringFeature, rowExpandingFeature, rowPaginationFeature, tableFeatures } from "@tanstack/react-table";

export const features = tableFeatures({
    rowExpandingFeature,
    expandedRowModel:createExpandedRowModel(),
    rowPaginationFeature,
    paginatedRowModel: createPaginatedRowModel(),  
    columnFilteringFeature,                                  
    globalFilteringFeature,
    filteredRowModel: createFilteredRowModel(),
    filterFns: { includesString: filterFn_includesString },

    columnSizingFeature // 추가
})
export type DataTableFeatures = typeof features