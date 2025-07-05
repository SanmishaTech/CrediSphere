export default function Validate(error, setError) {
  console.log("Error from server:", error.errors);
  const server = error.errors;
  if (server) {
    Object.entries(server).forEach(([name, errorObj]) => {
      // name = "user.name", errorObj = { type: "server", message: "..." }
      setError(name, errorObj);
    });
  }
}
