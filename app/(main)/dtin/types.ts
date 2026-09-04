/** 입고상태 — 문서 명세: PLAN | STANDBY | WORK | COMPLETED | CANCELED | UNKNOW */
export type InboundStatus =
    | "PLAN"
    | "STANDBY"
    | "WORK"
    | "COMPLETED"
    | "CANCELED"
    | "UNKNOW";

/** 제품 목록(SKU LIST) 한 줄 — 행 확장 상세의 상품 표와 1:1 */
export type InboundSku = {
    sku: string;          // 제품 sku
    productName: string;  // 제품 이름
    expQty: number;       // 접수 수량
    qty: number;          // 접수 수량 중 사용 가능 수량
    excQty: number;       // 접수 수량 중 오류 수량
    unit: string;         // 수량 단위 (예: Pcs)
};

/** 입고현황 목록 한 행 — GET /dtin 응답은 이 객체의 배열 */
export type InboundItem = {
    idx: number;                        // 행 고유 번호(int64)
    wmsId: number;                      // WMS ID
    wmsLinkId: number;                  // WMS LINK ID
    wmsLinkName: string;                // WMS LINK Name (예: ETON 01)
    statusOriginalCode: string | null;  // 입고상태 원본 코드(WMS 원문)
    status: InboundStatus;              // 입고상태
    ganNo: string | null;               // 접수번호 (마켓주문번호)
    clntName: string | null;            // 클라이언트 이름
    cntyCd: string;                     // 국가코드 — 새 국가가 올 수 있어 열린 문자열
    reqDt: number | null;               // 접수일 (UTC epoch ms) — 0이면 값 없음
    sipDt: number | null;               // 선적일 (UTC epoch ms)
    etaDt: number | null;               // 도착예정일 (UTC epoch ms)
    arvDt: number | null;               // 창고 도착일 (UTC epoch ms)
    prodList: InboundSku[];             // 제품 목록(SKU LIST)
    prodQty: number;                    // 제품 전체 수량
    contactName: string | null;         // 고객명
    contactTel: string | null;          // 고객연락처
    dataId: string;                     // 입고 아이디 (WMS 고유 아이디)
    dataRegDt: number | null;           // 입고 정보 생성일 (UTC epoch ms)
    dataUpdDt: number | null;           // 입고 정보 변경일 (UTC epoch ms)
    regDt: number | null;               // FBR 시스템 정보 등록일 (UTC epoch ms) — 0이면 값 없음
    updDt: number | null;               // FBR 시스템 정보 변경일 (UTC epoch ms)
};
