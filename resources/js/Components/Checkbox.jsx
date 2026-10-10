export default function Checkbox({ className = '', ...props }) {
    return (
        <input
            {...props}
            type="checkbox"
            className={'h-4 w-4 rounded border-line text-brand shadow-sm focus:ring-brand ' + className}
        />
    );
}
