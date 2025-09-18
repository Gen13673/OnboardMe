"use client";
import * as React from "react";
import { Button } from "@/app/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/app/components/ui/command";
import type { User } from "@/app/models/User";

type Props = {
  buddies: User[];
  value: User | null;
  onChange: (b: User) => void;
  placeholder?: string;
};

export function BuddyCombobox({
  buddies,
  value,
  onChange,
  placeholder = "Seleccionar buddy…",
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState("");

  const fullLabel = value
    ? `${value.firstName ?? ""} ${value.lastName ?? ""}`.trim() || value.email || `ID ${value.id}`
    : placeholder;

  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  const filtered = React.useMemo(() => {
    const q = norm(input.trim());
    if (!q) return buddies;
    return buddies.filter(b => norm(`${b.firstName} ${b.lastName} ${b.email ?? ""}`).includes(q));
  }, [buddies, input]);

  const getInitials = (firstName: string, lastName?: string) =>
    `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`.toUpperCase();

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={`w-full justify-between ${!value ? "text-gray-400" : ""}`}
          >
            {fullLabel}
            <span aria-hidden>▾</span>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command shouldFilter={false}>
            <CommandList>
              {/* Input de búsqueda integrado en el cajón */}
              <div className="px-2 pt-2">
                <CommandInput
                  value={input}
                  onValueChange={setInput}
                  placeholder="Buscar por nombre..."
                  autoFocus
                  className="text-sm"
                />
              </div>

              <CommandEmpty className="px-3 py-2">Sin resultados…</CommandEmpty>

              <CommandGroup heading="Buddies">
                {filtered.map(b => {
                  const name = `${b.firstName ?? ""} ${b.lastName ?? ""}`.trim() || b.email || `ID ${b.id}`;
                  return (
                    <CommandItem
                      key={b.id}
                      onSelect={() => { onChange(b); setOpen(false); setInput(""); }}
                      className="cursor-pointer hover:bg-muted/70 hover:shadow-md aria-selected:bg-muted/70 aria-selected:shadow-md rounded-md"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{getInitials(b.firstName, b.lastName)}</span>
                        </div>
                        <div className="flex w-full items-center justify-between">
                          <span className="font-medium">{name}</span>
                          {b.email && <span className="text-xs text-muted-foreground">{b.email}</span>}
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
    </div>
  );
}
