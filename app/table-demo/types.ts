// ── 응답 타입 (실제 프로젝트라면 API 응답 모양 그대로) ──
export type OrderLine = {
    sku: string;          // 상품 코드
    productName: string;  // 상품명
    qty: number;          // 수량
    unit: string;         // 단위 (예: EA, SET)
};

export type OrderItem = {
    idx: number;
    orderNo: string;      // 주문번호
    productName: string;  // 대표 상품명
    status: string;       // 상태 코드 (열린 문자열)
    countryCode: string;  // 국가코드 "FR", "DE" ...
    reqDt: number;        // 접수일 (epoch "초")
    arvDt: number;        // 도착일 (epoch "초", 0이면 미도착)
    items: OrderLine[];   // 주문 상품 목록 — T-3에서 행 아래에 펼쳐 보임
};
