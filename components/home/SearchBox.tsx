export default function SearchBox() {
  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <input
        type="text"
        placeholder="ماذا تريد أن تتعلم اليوم؟"
        style={{
          width: "600px",
          maxWidth: "90%",
          padding: "15px",
          fontSize: "18px",
          borderRadius: "10px",
          border: "1px solid #ccc",
        }}
      />
    </div>
  );
}