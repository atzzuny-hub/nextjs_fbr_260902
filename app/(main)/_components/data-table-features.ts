import { createExpandedRowModel, rowExpandingFeature, rowPaginationFeature, tableFeatures } from "@tanstack/react-table";

export const features = tableFeatures({
    rowExpandingFeature,
    expandedRowModel:createExpandedRowModel(),
    rowPaginationFeature,
})
export type DataTableFeatures = typeof features