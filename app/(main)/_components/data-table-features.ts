import { createExpandedRowModel, rowExpandingFeature, tableFeatures } from "@tanstack/react-table";

export const features = tableFeatures({
    rowExpandingFeature,
    expandedRowModel:createExpandedRowModel()
})
export type DataTableFeatures = typeof features