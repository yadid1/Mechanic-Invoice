import InvoiceForm from "@/components/InvoiceForm";

export default function Home() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">New Invoice</h2>
        <p className="text-gray-500 mt-1">
          Fill out the form below to create a customer receipt.
        </p>
      </div>
      <InvoiceForm />
    </div>
  );
}
