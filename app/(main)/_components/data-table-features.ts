import { createExpandedRowModel, createPaginatedRowModel, rowExpandingFeature, rowPaginationFeature, tableFeatures } from "@tanstack/react-table";

export const features = tableFeatures({
    rowExpandingFeature,
    expandedRowModel:createExpandedRowModel(),
    rowPaginationFeature,
    paginatedRowModel: createPaginatedRowModel(),
})
export type DataTableFeatures = typeof features