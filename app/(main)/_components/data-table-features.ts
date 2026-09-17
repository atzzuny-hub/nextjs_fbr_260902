import { columnSizingFeature, createExpandedRowModel, createPaginatedRowModel, rowExpandingFeature, rowPaginationFeature, tableFeatures } from "@tanstack/react-table";

export const features = tableFeatures({
    rowExpandingFeature,
    expandedRowModel:createExpandedRowModel(),
    rowPaginationFeature,
    paginatedRowModel: createPaginatedRowModel(),  

    columnSizingFeature 
})
export type DataTableFeatures = typeof features