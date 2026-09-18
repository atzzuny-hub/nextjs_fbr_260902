import { columnResizingFeature, columnSizingFeature, createExpandedRowModel, createPaginatedRowModel, createSortedRowModel, rowExpandingFeature, rowPaginationFeature, rowSortingFeature, sortFn_alphanumeric, sortFn_datetime, sortFn_text, tableFeatures } from "@tanstack/react-table";

export const features = tableFeatures({
    rowExpandingFeature,
    expandedRowModel:createExpandedRowModel(),
    rowPaginationFeature,
    paginatedRowModel: createPaginatedRowModel(),  
    columnSizingFeature,
    columnResizingFeature,

    rowSortingFeature,
    sortedRowModel: createSortedRowModel(),
    sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text, datetime: sortFn_datetime },

})
export type DataTableFeatures = typeof features