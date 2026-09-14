/*
    *  --------------------------------------------------------  *
    *  -----  counter.tsx  --  /components/counter.tsx  -----  *
    *  --------------------------------------------------------  *
*/
"use client";

import { useState } from "react";
import type { ReactElement } from "react";

/**
 * -------------------------
 * -----  `Counter()`  -----
 * -------------------------
 * - Muestra un contador con botones para incrementar y decrementar su valor.
 */
const Counter = (): ReactElement => {

    /** - `valor actual del contador` */
    const [count, setCount] = useState<number>(0);

    /**
     * ---------------------------
     * -----  `increment()`  -----
     * ---------------------------
     * - Suma 1 al valor del contador.
     */
    const increment = (): void => {
        setCount((current: number): number => current + 1);
    };

    /**
     * ---------------------------
     * -----  `decrement()`  -----
     * ---------------------------
     * - Resta 1 al valor del contador.
     */
    const decrement = (): void => {
        setCount((current: number): number => current - 1);
    };

    return (
        <section className="flex flex-col items-center gap-4 rounded-xl border border-[#EADDCE] bg-white p-6">
            <p role="status" className="text-4xl font-bold text-[#4A3F35]">{count}</p>
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={decrement}
                    aria-label="Decrementar contador"
                    className="rounded-lg bg-[#FBD8CC] px-4 py-2 text-sm font-semibold text-[#D9684A] cursor-pointer"
                >
                    -
                </button>
                <button
                    type="button"
                    onClick={increment}
                    aria-label="Incrementar contador"
                    className="rounded-lg bg-[#FBD8CC] px-4 py-2 text-sm font-semibold text-[#D9684A] cursor-pointer"
                >
                    +
                </button>
            </div>
        </section>
    );
};

export default Counter;
