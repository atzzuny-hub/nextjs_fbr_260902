import { tableFeatures, rowExpandingFeature, createExpandedRowModel } from "@tanstack/react-table";

// v9는 쓸 기능만 등록하는 방식. T-2에선 빈 객체(코어만)였고, T-3에서 행 펼치기를 처음 등록.
// 등록 전엔 row.getIsExpanded() 같은 메서드가 타입에도 런타임에도 없다.
export const features = tableFeatures({
    rowExpandingFeature,                          // 행 메서드(getIsExpanded 등) + expanded 상태
    expandedRowModel: createExpandedRowModel(),   // 펼친 subRows를 행 모델에 끼워 넣는 슬롯 — 이 예제는 subRows(트리)가 없어 실제론 통과.
                                                  // 상세 행은 data-table.tsx가 row.getIsExpanded()를 보고 직접 그린다 (공식 Setup 관례대로 함께 등록)
});
export type DataTableFeatures = typeof features;
