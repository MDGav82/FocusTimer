import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"

export default function CycleSelect() {

    const cycles = [
        { id: 1, name: "Cycle de base", periods: [
            { name: "Travail", type: "work", duration: 25 * 60 },]}, { id: 2, name: "Cycle de base", periods: [
            { name: "Travail", type: "work", duration: 25 * 60 },]}]
    return (
       <div>{cycles.map((cycle) => (
          <Card key={cycle.id}>
            <h4>{cycle.name}</h4>
            <p>{cycle.periods.map((p) => `${p.name} (${p.duration / 60}m)`).join(", ")}</p>
            <Button variant="outline" size="sm" className="mt-2">Modifier le temps</Button>
            <Button variant="outline" size="sm" className="mt-2">Dupliquer</Button>
            <div><Switch /> Changer le type</div>
            <Button variant="outline" size="sm" className="mt-2">Afficher les détails</Button>
          </Card>
        ))}
        </div>
    )
}