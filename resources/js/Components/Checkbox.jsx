export default function Checkbox({ className = '', ...props }) {
    return (
        <input
            {...props}
            type="checkbox"
            className={'h-4 w-4 rounded border-slate-300 text-indigo-600 shadow-sm focus:ring-indigo-500 ' + className}
        />
    );
}
