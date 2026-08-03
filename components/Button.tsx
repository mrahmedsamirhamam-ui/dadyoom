type ButtonProps = {
  text: string;
  onClick?: () => void;
};

export default function Button({ text, onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-3 rounded-xl transition"
    >
      {text}
    </button>
  );
}