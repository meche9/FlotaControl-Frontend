import React from 'react';

export const Table = React.forwardRef<
  HTMLTableElement,
  React.TableHTMLAttributes<HTMLTableElement>
>(({ children, className = '', ...props }, ref) => {
  return (
    <div className="w-full overflow-x-auto">
      <table
        ref={ref}
        className={`w-full text-left border-collapse min-w-[640px] text-xs ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  );
});
Table.displayName = 'Table';

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ children, className = '', ...props }, ref) => {
  return (
    <thead
      ref={ref}
      className={`border-b border-slate-100 text-[10px] font-bold text-slate-400 tracking-wider uppercase select-none ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
});
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ children, className = '', ...props }, ref) => {
  return (
    <tbody
      ref={ref}
      className={`divide-y divide-slate-50 text-xs ${className}`}
      {...props}
    >
      {children}
    </tbody>
  );
});
TableBody.displayName = 'TableBody';

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ children, className = '', ...props }, ref) => {
  return (
    <tr
      ref={ref}
      className={`hover:bg-slate-50/80 transition-colors duration-150 group ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
});
TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ children, className = '', ...props }, ref) => {
  return (
    <th
      ref={ref}
      className={`pb-3 px-4 first:pl-0 last:pr-0 font-bold whitespace-nowrap ${className}`}
      {...props}
    >
      {children}
    </th>
  );
});
TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ children, className = '', ...props }, ref) => {
  return (
    <td
      ref={ref}
      className={`py-4 px-4 first:pl-0 last:pr-0 align-middle text-slate-700 ${className}`}
      {...props}
    >
      {children}
    </td>
  );
});
TableCell.displayName = 'TableCell';

export interface TableEmptyProps {
  colSpan: number;
  message?: string;
  description?: string;
  icon?: React.ReactNode;
}

export const TableEmpty: React.FC<TableEmptyProps> = ({
  colSpan,
  message = 'No se encontraron registros',
  description = 'Intenta ajustar los filtros o el término de búsqueda.',
  icon,
}) => {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 text-center text-slate-400">
        <div className="flex flex-col items-center justify-center gap-2">
          {icon && <div className="text-slate-300">{icon}</div>}
          <p className="font-semibold text-xs text-slate-700">{message}</p>
          {description && <p className="text-[11px] text-slate-400">{description}</p>}
        </div>
      </td>
    </tr>
  );
};
