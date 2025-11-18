"use client";
import * as React from "react";
import { Button } from "@/app/components/ui/button";
import { UserAvatar } from "@/app/components/UserAvatar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/app/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/app/components/ui/command";
import type { User } from "@/app/models/User";

type Props = {
    buddies: User[];
    value: User | null;
    onChange: (b: User | null) => void;
    onClear?: () => void;
    showAllOption?: boolean;
    placeholder?: string;
};

export function BuddyCombobox({
    buddies,
    value,
    onChange,
    onClear,
    showAllOption = false,
    placeholder = "Seleccionar buddy…",
}: Props) {
    const [open, setOpen] = React.useState(false);
    const [input, setInput] = React.useState("");

    const fullLabel =
        value
            ? `${value.firstName ?? ""} ${value.lastName ?? ""}`.trim() ||
            (value as any).email ||
            `ID ${value.id}`
            : placeholder;

    const norm = (s: string) =>
        s
            .toLowerCase()
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "");

    const filtered = React.useMemo(() => {
        const q = norm(input.trim());
        if (!q) return buddies;
        return buddies.filter((b) =>
            norm(
                `${b.firstName} ${b.lastName} ${(b as any).email ?? ""} ${(b as any).area ?? ""}`,
            ).includes(q),
        );
    }, [buddies, input]);

    const getInitials = (firstName: string, lastName?: string) =>
        `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`.toUpperCase();

    const clearToAll = () => {
        if (onClear) onClear();
        else onChange(null);
        setOpen(false);
        setInput("");
    };

    return (
        <div className="w-full">
            <Popover open={open} onOpenChange={setOpen} modal={false}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between text-gray-900"
                        title={typeof fullLabel === "string" ? fullLabel : undefined}
                    >
                        <span className="truncate">
                            {value && (value as any).area
                                ? `${fullLabel} — ${(value as any).area}`
                                : fullLabel}
                        </span>
                        <span aria-hidden className="ml-2 opacity-60">▾</span>
                    </Button>
                </PopoverTrigger>

                <PopoverContent
                    align="start"
                    sideOffset={4}
                    className="w-[var(--radix-popover-trigger-width)] p-0 z-[120]"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    onPointerDownOutside={(e) => e.preventDefault()}
                    onInteractOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.stopPropagation()}
                >
                    <Command shouldFilter={false}>
                        <CommandList className="max-h-64 overflow-auto" >
                            <div className="px-2 pt-2">
                                <CommandInput
                                    value={input}
                                    onValueChange={setInput}
                                    placeholder="Buscar por nombre o área..."
                                    autoFocus
                                    className="text-sm"
                                />
                            </div>

                            <CommandEmpty className="px-3 py-2">Sin resultados…</CommandEmpty>

                            {showAllOption && (
                                <CommandGroup heading="Opciones">
                                    <CommandItem onSelect={clearToAll}>
                                        Todos los buddies
                                    </CommandItem>
                                </CommandGroup>
                            )}

                            <CommandGroup heading="Buddies">
                                {filtered.map((b: any) => {
                                    const name =
                                        `${b.firstName ?? ""} ${b.lastName ?? ""}`.trim() ||
                                        b.email ||
                                        `ID ${b.id}`;
                                    return (
                                        <CommandItem
                                            value={name}
                                            key={b.id}
                                            onSelect={() => {
                                                onChange(b);
                                                setOpen(false);
                                                setInput("");
                                            }}
                                            className="cursor-pointer hover:bg-muted/70 hover:shadow-md aria-selected:bg-muted/70 aria-selected:shadow-md rounded-md"
                                        >
                                            <div className="flex items-center gap-3 py-1.5">
                                                <div className="h-8 w-8 shrink-0 aspect-square">
                                                    <UserAvatar
                                                        firstName={b.firstName}
                                                        lastName={b.lastName}
                                                        size="sm"
                                                        className="h-full w-full rounded-full"
                                                    />
                                                </div>

                                                <div className="flex w-full min-w-0 items-center justify-between">
                                                    <span className="font-medium truncate">{name}</span>
                                                    {(b.area ?? b.email) && (
                                                        <span className="text-xs text-muted-foreground truncate max-w-[12rem] ml-3">
                                                            {b.area ?? b.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div >
    );
}
