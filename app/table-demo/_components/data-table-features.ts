import { tableFeatures } from "@tanstack/react-table";

// v9는 쓸 기능만 등록하는 방식. 빈 객체 = 코어(행·헤더 모델)만.
// 펼치기·페이지네이션이 필요해지면 여기에 rowExpandingFeature, rowPaginationFeature를 추가
export const features = tableFeatures({});
export type DataTableFeatures = typeof features;
