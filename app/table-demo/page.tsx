import type { OrderItem } from "./types";
import { columns, renderSubRow } from "./columns";
import { DataTable } from "./_components/data-table";

// ── 더미데이터 (API 대신) ──
const DUMMY: OrderItem[] = [
    { idx: 1, orderNo: "ORD-20260910-001", productName: "가죽 크로스백",     status: "DELIVERED", countryCode: "FR", reqDt: 1788000000, arvDt: 1788350000,
      items: [{ sku: "BAG-001", productName: "가죽 크로스백", qty: 1, unit: "EA" }, { sku: "BAG-001-ST", productName: "교체용 스트랩", qty: 1, unit: "EA" }] },
    { idx: 2, orderNo: "ORD-20260910-002", productName: "울 니트 스웨터",     status: "SHIPPING",  countryCode: "DE", reqDt: 1788100000, arvDt: 0,
      items: [{ sku: "KNT-204-M", productName: "울 니트 스웨터 M", qty: 2, unit: "EA" }] },
    { idx: 3, orderNo: "ORD-20260910-003", productName: "에스프레소 머신",   status: "RECEIVED",  countryCode: "IT", reqDt: 1788150000, arvDt: 0,
      items: [{ sku: "ESP-900", productName: "에스프레소 머신", qty: 1, unit: "EA" }, { sku: "ESP-CUP", productName: "데미타세 컵 세트", qty: 1, unit: "SET" }] },
    { idx: 4, orderNo: "ORD-20260910-004", productName: "린넨 셔츠",         status: "ORDERED",   countryCode: "ES", reqDt: 1788200000, arvDt: 0,
      items: [{ sku: "SHT-115-L", productName: "린넨 셔츠 L", qty: 3, unit: "EA" }] },
    { idx: 5, orderNo: "ORD-20260910-005", productName: "스테인리스 물병",   status: "DELIVERED", countryCode: "GB", reqDt: 1787900000, arvDt: 1788280000,
      items: [{ sku: "BTL-500", productName: "스테인리스 물병 500ml", qty: 4, unit: "EA" }] },
    { idx: 6, orderNo: "ORD-20260910-006", productName: "튤립 구근 세트",     status: "SHIPPING",  countryCode: "NL", reqDt: 1788120000, arvDt: 0,
      items: [{ sku: "TLP-SET", productName: "튤립 구근 세트", qty: 1, unit: "SET" }] },
    { idx: 7, orderNo: "ORD-20260910-007", productName: "다크 초콜릿 박스",   status: "XXNEW",     countryCode: "ZZ", reqDt: 0,          arvDt: 0,
      items: [] },   // 폴백 행: 상품 목록도 비어 있음
];

// 실제 프로젝트에선 여기가 API 호출: const res = await apiFetch(...); return res.json()
async function getData(): Promise<OrderItem[]> {
    return DUMMY;
}

// 서버 컴포넌트: 조회는 서버에서, 렌더는 DataTable(클라이언트)에 위임
// renderSubRow는 함수라 여기서 만들 수 없고, "use client" 모듈(columns.tsx)의 export를 참조로 넘긴다
export default async function TableDemoPage() {
    const data = await getData();

    return (
        <div className="p-6">
            <h1 className="mb-4 text-xl font-bold">주문 목록 (더미)</h1>
            <p className="mb-2 text-sm text-muted-foreground">조회 결과 {data.length}건</p>
            <DataTable columns={columns} data={data} renderSubRow={renderSubRow} />
        </div>
    );
}
