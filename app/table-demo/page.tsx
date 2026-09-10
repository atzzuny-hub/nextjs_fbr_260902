import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── 응답 타입 ──
type OrderItem = {
    idx: number;
    orderNo: string;      // 주문번호
    productName: string;  // 상품명
    status: string;       // 상태 코드 (열린 문자열)
    countryCode: string;  // 국가코드 "FR", "DE" ...
    reqDt: number;        // 접수일 (epoch "초")
    arvDt: number;        // 도착일 (epoch "초", 0이면 미도착)
};

// ── 상태: 코드·한글·배지색을 한 곳에 (단일 출처) ──
const STATUS_OPTIONS = [
    { value: "ORDERED",   label: "주문",     badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
    { value: "RECEIVED",  label: "접수",     badge: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
    { value: "SHIPPING",  label: "배송중",   badge: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
    { value: "DELIVERED", label: "배송완료", badge: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" },
];

// ── 셀 가공 함수 3종 ──
const statusOf = (s: string) =>
    STATUS_OPTIONS.find((o) => o.value === s)
    ?? { label: s, badge: "bg-muted text-muted-foreground" };

const flag = (cc: string) =>
    /^[A-Z]{2}$/.test(cc)
        ? cc.replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
        : "";

function formatDateTime(sec: number | null | undefined) {
    if (!sec) return "-";
    const d = new Date(sec * 1000);   // 초 단위 → ×1000
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

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

export default function TableDemoPage() {
    const data = DUMMY;

    return (
        <div className="p-6">
            <h1 className="mb-4 text-xl font-bold">주문 목록 (더미)</h1>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>주문번호</TableHead>
                        <TableHead>상품명</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead>국가</TableHead>
                        <TableHead>접수일</TableHead>
                        <TableHead>도착일</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row) => (
                        <TableRow key={row.idx}>
                            <TableCell className="font-medium">{row.orderNo}</TableCell>
                            <TableCell>{row.productName}</TableCell>
                            <TableCell>
                                <Badge className={cn("border-transparent", statusOf(row.status).badge)}>
                                    {statusOf(row.status).label}
                                </Badge>
                            </TableCell>
                            <TableCell>{flag(row.countryCode)} {row.countryCode}</TableCell>
                            <TableCell>{formatDateTime(row.reqDt)}</TableCell>
                            <TableCell>{formatDateTime(row.arvDt)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
