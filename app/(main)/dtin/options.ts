// app/(main)/dtin/options.ts

export const SEARCH_DT_OPTIONS = [
    { value: "REQ_DT",  label: "입고접수일" },
    { value: "WRHS_DT", label: "창고도착일" },
    { value: "CMPL_DT", label: "입고완료일" },
];

export const ORDER_STATUS_OPTIONS = [
    { value: "ALL",       label: "전체",     badge: "" },
    { value: "PLAN",      label: "예정",     badge: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
    { value: "STANDBY",   label: "대기",     badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300" },
    { value: "WORK",      label: "작업중",   badge: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
    { value: "COMPLETED", label: "입고",     badge: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" },
    { value: "CANCELED",  label: "취소",     badge: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
    { value: "UNKNOW",    label: "알수없음", badge: "bg-muted text-muted-foreground" },
];