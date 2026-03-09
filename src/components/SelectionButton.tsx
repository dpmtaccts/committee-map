interface SelectionButtonProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const SelectionButton = ({ label, selected, onClick, disabled }: SelectionButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="font-body cursor-pointer transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
    style={{
      padding: "7px 16px",
      borderRadius: 9999,
      fontSize: 13,
      fontWeight: 600,
      minHeight: 44,
      border: selected ? "1px solid transparent" : "1px solid #D7DADD",
      background: selected ? "#2A9D8F" : "#FFFFFF",
      color: selected ? "#FFFFFF" : "#383838",
    }}
  >
    {label}
  </button>
);

export default SelectionButton;
