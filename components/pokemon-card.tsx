/*
    *  ----------------------------------------------------------------  *
    *  -----  pokemon-card.tsx  --  /components/pokemon-card.tsx  -----  *
    *  ----------------------------------------------------------------  *
*/
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { ReactElement } from "react";

/** - `id mínimo de Pokémon disponible en la PokéAPI` */
const MIN_POKEMON_ID = 1;

/** - `id máximo de Pokémon disponible en la PokéAPI` */
const MAX_POKEMON_ID = 1025;

/** - `clave de localStorage donde se recuerda el último Pokémon visto` */
const STORAGE_KEY = "opendaycare.pokemonId";

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
 * ---------------------------------------------
 * -----  `preloadSprite(url): Promise<void>`  -----
 * ---------------------------------------------
 * - Precarga el sprite en el navegador para que el cambio de Pokémon sea
 *   instantáneo y la imagen no parpadee.
 */
const preloadSprite = (url: string): Promise<void> =>
    new Promise((resolve: () => void): void => {
        const image = new window.Image();
        image.onload = (): void => resolve();
        image.onerror = (): void => resolve();
        image.src = url;
    });

/**
 * -------------------------------------------
 * -----  `readStoredPokemonId(): number`  -----
 * -------------------------------------------
 * - Lee el último Pokémon visto desde localStorage; si no hay valor válido,
 *   devuelve el primero.
 */
const readStoredPokemonId = (): number => {
    //  -----  en el servidor no hay localStorage: empezar por el primero  -----
    if (typeof window === "undefined") {
        return MIN_POKEMON_ID;
    }

    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        const parsed = Number(stored);

        //  -----  aceptar solo enteros dentro del rango de la PokéAPI  -----
        if (Number.isInteger(parsed) && parsed >= MIN_POKEMON_ID && parsed <= MAX_POKEMON_ID) {
            return parsed;
        }
    } catch (error: unknown) {
        console.error(error);
    }

    return MIN_POKEMON_ID;
};

/**
 * ----------------------------------------------------
 * -----  `storePokemonId(id): void`  -----
 * ----------------------------------------------------
 * - Guarda el Pokémon actual para restaurarlo en la próxima visita.
 */
const storePokemonId = (id: number): void => {
    try {
        window.localStorage.setItem(STORAGE_KEY, String(id));
    } catch (error: unknown) {
        console.error(error);
    }
};

/**
 * -------------------------------------
 * -----  `PokemonCard(): ReactElement`  -----
 * -------------------------------------
 * - Trae el Pokémon actual vía HTTP, lo muestra en pantalla, permite navegar
 *   al anterior/siguiente con botones y recuerda el último visto en localStorage.
 */
const PokemonCard = (): ReactElement => {

    /** - `id del Pokémon actual (restaurado de localStorage en el cliente)` */
    const [pokemonId, setPokemonId] = useState<number>((): number => readStoredPokemonId());

    /** - `datos del Pokémon actual` */
    const [pokemon, setPokemon] = useState<PokemonInfo | null>(null);

    /** - `estado de la petición HTTP` */
    const [status, setStatus] = useState<FetchStatus>("loading");

    //  -----  cargar el Pokémon cada vez que cambia el id  -----
    useEffect((): (() => void) | undefined => {
        
        let cancelled = false;

        fetchPokemon(pokemonId)
            .then(async (data: PokemonInfo): Promise<void> => {
                //  -----  esperar el sprite antes de cambiar la imagen visible  -----
                await preloadSprite(data.imageUrl);

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

    //  -----  guardar el id actual para la próxima visita  -----
    useEffect((): void => {
        storePokemonId(pokemonId);
    }, [pokemonId]);

    /**
     * ---------------------------
     * -----  `goToNext()`  ------
     * ---------------------------
     * - Avanza al siguiente Pokémon y marca el estado de carga.
     */
    const goToNext = (): void => {
        setStatus("loading");
        setPokemonId((current: number): number => Math.min(current + 1, MAX_POKEMON_ID));
    };

    /**
     * ---------------------------
     * -----  `goToPrev()`  ------
     * ---------------------------
     * - Regresa al Pokémon anterior y marca el estado de carga.
     */
    const goToPrev = (): void => {
        setStatus("loading");
        setPokemonId((current: number): number => Math.max(current - 1, MIN_POKEMON_ID));
    };

    return (
        <section aria-busy={status === "loading"} className="flex flex-col items-center gap-4 rounded-xl border border-[#EADDCE] bg-white p-6">
            <h2 className="text-lg font-bold text-[#4A3F35] capitalize">Pokémon actual</h2>

            {/*  -----  contenido según el estado de la petición  -----  */}
            {/*  -----  altura fija (sprite 160 + gap 16 + nombre 32) para que la tarjeta no salte  -----  */}
            <div className="flex h-52 flex-col items-center justify-center gap-4">
                {/*  -----  texto de estado: visible en la primera carga, oculto al navegar  -----  */}
                {status === "loading" && (
                    <p role="status" className={pokemon === null ? "text-[#A89A8B]" : "sr-only"}>
                        Cargando Pokémon…
                    </p>
                )}

                {status === "error" && (
                    <p role="alert" className="text-center text-sm font-semibold text-[#D9684A]">
                        No se pudo cargar el Pokémon. Inténtalo de nuevo.
                    </p>
                )}

                {/*  -----  sprite actual: sigue montado y se atenúa mientras carga el siguiente  -----  */}
                {status !== "error" && pokemon !== null && (
                    <div className={`flex flex-col items-center gap-4 transition-opacity duration-200 ${status === "loading" ? "opacity-40" : "opacity-100"}`}>
                        <Image
                            src={pokemon.imageUrl}
                            alt={`Sprite de ${pokemon.name}`}
                            width={160}
                            height={160}
                            unoptimized
                        />
                        <p className="text-2xl font-bold text-[#4A3F35] capitalize">
                            #{pokemon.id} {pokemon.name}
                        </p>
                    </div>
                )}
            </div>

            {/*  -----  navegación entre Pokémon  ----- */}
            <nav className="flex gap-3">
                <button
                    type="button"
                    onClick={goToPrev}
                    disabled={status === "loading" || pokemonId <= MIN_POKEMON_ID}
                    className="rounded-lg bg-[#FBD8CC] px-4 py-2 text-sm font-semibold text-[#D9684A] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    ← Anterior
                </button>
                <button
                    type="button"
                    onClick={goToNext}
                    disabled={status === "loading" || pokemonId >= MAX_POKEMON_ID}
                    className="rounded-lg bg-[#FBD8CC] px-4 py-2 text-sm font-semibold text-[#D9684A] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Siguiente →
                </button>
            </nav>
        </section>
    );
};

export default PokemonCard;
