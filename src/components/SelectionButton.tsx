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
    className={`
      px-5 py-2 rounded-full text-sm font-semibold font-body cursor-pointer
      transition-all duration-150 ease-in-out min-h-[44px]
      ${selected
        ? "bg-primary text-primary-foreground border border-transparent"
        : "bg-card text-foreground border border-border hover:bg-secondary"
      }
      disabled:opacity-50 disabled:cursor-not-allowed
    `}
  >
    {label}
  </button>
);

export default SelectionButton;
