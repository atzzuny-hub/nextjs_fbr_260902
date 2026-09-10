// ── 상태: 코드·한글·배지색을 한 곳에 (단일 출처) ──
// columns.tsx(배지)와 검색 셀렉트가 같이 쓰는 목록이라 별도 파일로 분리
export const STATUS_OPTIONS = [
    { value: "ORDERED",   label: "주문",     badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
    { value: "RECEIVED",  label: "접수",     badge: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
    { value: "SHIPPING",  label: "배송중",   badge: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
    { value: "DELIVERED", label: "배송완료", badge: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" },
];
