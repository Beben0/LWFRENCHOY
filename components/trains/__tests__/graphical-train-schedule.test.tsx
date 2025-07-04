import { render, screen } from "@testing-library/react";
import GraphicalTrainSchedule from "../graphical-train-schedule";

describe("GraphicalTrainSchedule", () => {
  it("affiche le titre", () => {
    render(<GraphicalTrainSchedule trains={[]} />);
    expect(screen.getByText(/trains/i)).toBeInTheDocument();
  });
});
