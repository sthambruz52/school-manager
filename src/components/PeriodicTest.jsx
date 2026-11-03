import MarksEntry from "./MarksEntry";

export default function PeriodicTest() {
  return (
    <MarksEntry
      title="Periodic Test"
      subtitle="Enter Test 1, Test 2 and Test 3 marks"
      types={["Test 1", "Test 2", "Test 3"]}
    />
  );
}