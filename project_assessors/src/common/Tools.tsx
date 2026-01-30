

export const phFormatDate = (date:string):any => {
    if(date === '')
        return undefined;
  return new Date(new Date(date).getTime() + 8 * 60 * 60 * 1000)
                      .toISOString()
                      .split('T')[0];             
}

export const formatDate = (date:string):any =>{
    if(date === '')
        return undefined;
    return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: "Asia/Manila"
        });
}

interface PreviewFieldProps {
  label: string;
  value: string | number;
}

export const PreviewField: React.FC<PreviewFieldProps> = ({ label, value }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <input
      type="text"
      value={value}
      disabled
      className="w-full px-3 py-2 border cursor-not-allowed border-gray-300 rounded-lg bg-gray-50"
    />
  </div>
);

export const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(value);
    };