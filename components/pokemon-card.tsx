/*
    *  ----------------------------------------------------------------  *
    *  -----  pokemon-card.tsx  --  /components/pokemon-card.tsx  -----  *
    *  ----------------------------------------------------------------  *
*/
"use client";

import { useEffect, useState } from "react";
import type { ReactElement } from "react";

/** - `datos mínimos del Pokémon que se muestran en pantalla` */
interface PokemonInfo {
    id: number;
    name: string;
    imageUrl: string;
}

/** - `estado de carga de la petición` */
type FetchStatus = "loading" | "success" | "error";

/**
 * -------------------------------------------
 * -----  `fetchPokemon(id): Promise<...>`  ---
 * -------------------------------------------
 * - Obtiene de la PokéAPI los datos del Pokémon con el id indicado.
 */
const fetchPokemon = async (id: number): Promise<PokemonInfo> => {
    const response: Response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);

    //  -----  si la respuesta no es correcta, lanzar error  -----
    if (!response.ok) {
        throw new Error(`No se pudo obtener el Pokémon ${id}`);
    }

    const data: unknown = await response.json();

    //  -----  validar la forma de la respuesta antes de usarla  -----
    if (
        typeof data !== "object" ||
        data === null ||
        !("id" in data) ||
        !("name" in data) ||
        !("sprites" in data) ||
        typeof data.name !== "string" ||
        typeof data.sprites !== "object" ||
        data.sprites === null ||
        !("front_default" in data.sprites) ||
        typeof data.sprites.front_default !== "string"
    ) {
        throw new Error("Respuesta inesperada de la PokéAPI");
    }

    return {
        id: data.id as number,
        name: data.name,
        imageUrl: data.sprites.front_default,
    };
};

/**
 * -------------------------------------
 * -----  `PokemonCard(): ReactElement`  -----
 * -------------------------------------
 * - Trae el Pokémon actual vía HTTP, lo muestra en pantalla y permite navegar
 *   al anterior/siguiente y regresar con botones.
 */
const PokemonCard = (): ReactElement => {

    /** - `id del Pokémon actual` */
    const [pokemonId, setPokemonId] = useState<number>(1);

    /** - `datos del Pokémon actual` */
    const [pokemon, setPokemon] = useState<PokemonInfo | null>(null);

    /** - `estado de la petición HTTP` */
    const [status, setStatus] = useState<FetchStatus>("loading");

    //  -----  cargar el Pokémon cada vez que cambia el id  -----
    useEffect((): (() => void) | undefined => {
        let cancelled = false;

        //  -----  marcar carga de forma asíncrona para evitar cascada de renders  -----
        Promise.resolve().then((): void => {
            if (!cancelled) setStatus("loading");
        });

        fetchPokemon(pokemonId)
            .then((data: PokemonInfo): void => {
                //  -----  ignorar respuestas de un id ya descartado  -----
                if (cancelled) return;
                setPokemon(data);
                setStatus("success");
            })
            .catch((error: unknown): void => {
                if (cancelled) return;
                console.error(error);
                setStatus("error");
            });

        return (): void => {
            cancelled = true;
        };
    }, [pokemonId]);

    /**
     * ---------------------------
     * -----  `goToNext()`  ------
     * ---------------------------
     * - Avanza al siguiente Pokémon.
     */
    const goToNext = (): void => {
        setPokemonId((current: number): number => Math.min(current + 1, 1025));
    };

    /**
     * ---------------------------
     * -----  `goToPrev()`  ------
     * ---------------------------
     * - Regresa al Pokémon anterior.
     */
    const goToPrev = (): void => {
        setPokemonId((current: number): number => Math.max(current - 1, 1));
    };

    return (
        <section className="flex flex-col items-center gap-4 rounded-xl border border-[#EADDCE] bg-white p-6">
            <h2 className="text-lg font-bold text-[#4A3F35] capitalize">Pokémon actual</h2>

            {/*  -----  contenido según el estado de la petición  ----- */}
            {status === "loading" && <p className="text-[#A89A8B]">Cargando Pokémon…</p>}

            {status === "error" && (
                <p className="text-sm font-semibold text-[#D9684A]">
                    No se pudo cargar el Pokémon. Inténtalo de nuevo.
                </p>
            )}

            {status === "success" && pokemon !== null && (
                <>
                    <img
                        src={pokemon.imageUrl}
                        alt={`Sprite de ${pokemon.name}`}
                        width={160}
                        height={160}
                    />
                    <p className="text-2xl font-bold text-[#4A3F35] capitalize">
                        #{pokemon.id} {pokemon.name}
                    </p>
                </>
            )}

            {/*  -----  navegación entre Pokémon  ----- */}
            <nav className="flex gap-3">
                <button
                    type="button"
                    onClick={goToPrev}
                    disabled={pokemonId <= 1}
                    className="rounded-lg bg-[#FBD8CC] px-4 py-2 text-sm font-semibold text-[#D9684A] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    ← Anterior
                </button>
                <button
                    type="button"
                    onClick={goToNext}
                    disabled={pokemonId >= 1025}
                    className="rounded-lg bg-[#FBD8CC] px-4 py-2 text-sm font-semibold text-[#D9684A] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Siguiente →
                </button>
            </nav>
        </section>
    );
};

export default PokemonCard;
