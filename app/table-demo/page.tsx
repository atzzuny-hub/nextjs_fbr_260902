import type { OrderItem } from "./types";
import { columns } from "./columns";
import { DataTable } from "./_components/data-table";

// ── 더미데이터 (API 대신) ──
const DUMMY: OrderItem[] = [
    { idx: 1, orderNo: "ORD-20260910-001", productName: "가죽 크로스백",     status: "DELIVERED", countryCode: "FR", reqDt: 1788000000, arvDt: 1788350000 },
    { idx: 2, orderNo: "ORD-20260910-002", productName: "울 니트 스웨터",     status: "SHIPPING",  countryCode: "DE", reqDt: 1788100000, arvDt: 0 },
    { idx: 3, orderNo: "ORD-20260910-003", productName: "에스프레소 머신",   status: "RECEIVED",  countryCode: "IT", reqDt: 1788150000, arvDt: 0 },
    { idx: 4, orderNo: "ORD-20260910-004", productName: "린넨 셔츠",         status: "ORDERED",   countryCode: "ES", reqDt: 1788200000, arvDt: 0 },
    { idx: 5, orderNo: "ORD-20260910-005", productName: "스테인리스 물병",   status: "DELIVERED", countryCode: "GB", reqDt: 1787900000, arvDt: 1788280000 },
    { idx: 6, orderNo: "ORD-20260910-006", productName: "튤립 구근 세트",     status: "SHIPPING",  countryCode: "NL", reqDt: 1788120000, arvDt: 0 },
    { idx: 7, orderNo: "ORD-20260910-007", productName: "다크 초콜릿 박스",   status: "XXNEW",     countryCode: "ZZ", reqDt: 0,          arvDt: 0 },
];

// 실제 프로젝트에선 여기가 API 호출: const res = await apiFetch(...); return res.json()
async function getData(): Promise<OrderItem[]> {
    return DUMMY;
}

// 서버 컴포넌트: 조회는 서버에서, 렌더는 DataTable(클라이언트)에 위임
export default async function TableDemoPage() {
    const data = await getData();

    return (
        <div className="p-6">
            <h1 className="mb-4 text-xl font-bold">주문 목록 (더미)</h1>
            <p className="mb-2 text-sm text-muted-foreground">조회 결과 {data.length}건</p>
            <DataTable columns={columns} data={data} />
        </div>
    );
}
