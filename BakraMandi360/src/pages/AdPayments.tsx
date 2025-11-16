
import { useState, useEffect } from "react";
import { CreditCard, Search, FileText, ArrowUpDown, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from 'axios';
import { toast } from 'sonner';

interface Payment {
  id: string;
  orderId: string;
  buyer: string | null;
  seller: string | null;
  buyerId: number | null;
  amount: number;
  total: number;
  subtotal: number;
  tax: number;
  method: string;
  paymentMethod: string;
  paymentDetails: { bankName?: string; accountNumber?: string; stripePaymentIntentId?: string } | null;
  status: string;
  date: string | null;
  items: { id: string; title: string; price: number }[];
}

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('http://localhost:3001/payment/admin/all');
        console.log('Payment data from backend:', response.data);
        
        // Transform the data to match our Payment interface
        const transformedPayments: Payment[] = response.data.map((order: any, index: number) => {
          console.log(`\n=== Processing Payment ${index + 1} ===`);
          console.log("Raw order data:", order);
          console.log("Available order keys:", Object.keys(order));
          
          // Extract buyer name with multiple fallbacks
          let buyerName = 'Unknown Buyer';
          if (order.buyer) buyerName = order.buyer;
          else if (order.buyerName) buyerName = order.buyerName;
          else if (order.customerName) buyerName = order.customerName;
          else if (order.user?.name) buyerName = order.user.name;
          else if (order.buyerId) buyerName = `Buyer ID: ${order.buyerId}`;
          
          // Extract seller name with multiple fallbacks
          let sellerName = 'Unknown Seller';
          if (order.seller) sellerName = order.seller;
          else if (order.sellerName) sellerName = order.sellerName;
          else if (order.vendorName) sellerName = order.vendorName;
          else if (order.merchant) sellerName = order.merchant;
          
          // Extract payment method with fallbacks
          let paymentMethod = order.paymentMethod || order.method || order.type || 'Unknown';
          
          // Extract amount with fallbacks
          let amount = order.total || order.amount || order.price || 0;
          
          const transformedPayment = {
            id: order.id || `payment_${index + 1}`,
            orderId: order.orderId || order.orderNumber || order.id || `ORD-${index + 1}`,
            buyer: buyerName,
            seller: sellerName,
            buyerId: order.buyerId,
            amount: amount,
            total: amount,
            subtotal: order.subtotal || amount,
            tax: order.tax || 0,
            method: paymentMethod,
            paymentMethod: paymentMethod,
            paymentDetails: order.paymentDetails || order.details || order.metadata,
            status: order.status || 'Completed',
            date: order.date || order.createdAt || order.timestamp || new Date().toISOString(),
            items: order.items || order.products || [],
          };
          
          console.log("Transformed payment:", transformedPayment);
          return transformedPayment;
        });
        
        setPayments(transformedPayments);
      } catch (error) {
        console.error('Error fetching payments:', error);
        toast.error('Failed to load payment data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, []);
  
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const filteredPayments = payments.filter(payment => 
    (payment.buyer && payment.buyer.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (payment.seller && payment.seller.toLowerCase().includes(searchTerm.toLowerCase())) ||
    payment.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedPayments = [...filteredPayments].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const direction = sortDirection === "asc" ? 1 : -1;
    
    switch (sortColumn) {
      case "date":
        return direction * ((a.date ? new Date(a.date).getTime() : 0) - (b.date ? new Date(b.date).getTime() : 0));
      case "amount":
        return direction * (a.amount - b.amount);
      case "buyer":
        return direction * ((a.buyer || '').localeCompare(b.buyer || ''));
      case "seller":
        return direction * ((a.seller || '').localeCompare(b.seller || ''));
      case "status":
        return direction * (a.status.localeCompare(b.status));
      default:
        return 0;
    }
  });

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString('en-PK')}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-PK');
  };

  const formatPaymentMethod = (method: string) => {
    return method.charAt(0).toUpperCase() + method.slice(1);
  };

  const formatPaymentDetails = (details: any, method: string, payment: Payment) => {
    console.log("=== PAYMENT DETAILS DEBUG ===");
    console.log("Payment ID:", payment.id);
    console.log("Payment method:", method);
    console.log("Payment details:", details);
    console.log("Full payment object:", payment);
    
    if (!details) {
      // If no details object, try to create meaningful info from payment method
      switch (method?.toLowerCase()) {
        case 'stripe':
          return 'Stripe Payment';
        case 'card':
          return 'Card Payment';
        case 'bank':
          return 'Bank Transfer';
        case 'cash':
          return 'Cash Payment';
        case 'online':
          return 'Online Payment';
        default:
          return method ? `${method} Payment` : 'Payment Completed';
      }
    }
    
    // Handle different possible structures of payment details
    if (typeof details === 'string') {
      return details;
    }
    
    if (typeof details === 'object') {
      // Try various possible field combinations
      if (details.bankName && details.accountNumber) {
        return `${details.bankName} - ${details.accountNumber}`;
      }
      if (details.bank && details.account) {
        return `${details.bank} - ${details.account}`;
      }
      if (details.stripePaymentIntentId) {
        return `Stripe - ${details.stripePaymentIntentId.substring(0, 20)}...`;
      }
      if (details.paymentIntentId) {
        return `Stripe - ${details.paymentIntentId.substring(0, 20)}...`;
      }
      if (details.transactionId) {
        return `Transaction ID: ${details.transactionId}`;
      }
      if (details.reference) {
        return `Ref: ${details.reference}`;
      }
      if (details.cardLast4) {
        return `Card ending in ${details.cardLast4}`;
      }
      if (details.last4) {
        return `Card ending in ${details.last4}`;
      }
      
      // If details object exists but no recognizable fields, show method info
      const detailKeys = Object.keys(details);
      if (detailKeys.length > 0) {
        console.log("Available detail keys:", detailKeys);
        // Try to use the first meaningful value
        for (const key of detailKeys) {
          if (details[key] && typeof details[key] === 'string' && details[key].length > 0) {
            return `${key}: ${details[key]}`;
          }
        }
      }
    }
    
    // Final fallback based on payment method
    return method ? `${method} Payment` : 'Payment Completed';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const filterPaymentsByStatus = (status: string) => {
    if (status === 'all-payments') return sortedPayments;
    return sortedPayments.filter(payment => payment.status.toLowerCase() === status.toLowerCase());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="py-6 px-8 flex items-center justify-between border-b bg-card/50 sticky top-0 z-10 backdrop-blur">
        <div className="flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">Payments</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search payments..."
              className="pl-10 pr-4 py-2 rounded-md border border-input bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white">
            <FileText className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="p-8">
        {payments.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl shadow-sm">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold text-primary mb-3">No Payments Found</h3>
            <p className="text-muted-foreground">No payment data available yet.</p>
          </div>
        ) : (
          <Tabs defaultValue="all-payments" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all-payments">All Payments ({payments.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({payments.filter(p => p.status.toLowerCase() === 'completed').length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({payments.filter(p => p.status.toLowerCase() === 'pending').length})</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled ({payments.filter(p => p.status.toLowerCase() === 'cancelled').length})</TabsTrigger>
            </TabsList>
            
            {['all-payments', 'completed', 'pending', 'cancelled'].map(tab => (
              <TabsContent key={tab} value={tab} className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead onClick={() => handleSort("buyer")} className="cursor-pointer">
                          <div className="flex items-center">
                            Buyer
                            {sortColumn === "buyer" && (
                              <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                            )}
                          </div>
                        </TableHead>
                        <TableHead onClick={() => handleSort("seller")} className="cursor-pointer">
                          <div className="flex items-center">
                            Seller
                            {sortColumn === "seller" && (
                              <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                            )}
                          </div>
                        </TableHead>
                        <TableHead onClick={() => handleSort("amount")} className="cursor-pointer">
                          <div className="flex items-center">
                            Amount
                            {sortColumn === "amount" && (
                              <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                            )}
                          </div>
                        </TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Payment Details</TableHead>
                        <TableHead onClick={() => handleSort("status")} className="cursor-pointer">
                          <div className="flex items-center">
                            Status
                            {sortColumn === "status" && (
                              <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                            )}
                          </div>
                        </TableHead>
                        <TableHead onClick={() => handleSort("date")} className="cursor-pointer">
                          <div className="flex items-center">
                            Date
                            {sortColumn === "date" && (
                              <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterPaymentsByStatus(tab).map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.orderId}</TableCell>
                          <TableCell>{payment.buyer || 'Unknown'}</TableCell>
                          <TableCell>{payment.seller || 'Unknown'}</TableCell>
                          <TableCell>{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>{formatPaymentMethod(payment.paymentMethod)}</TableCell>
                          <TableCell>{formatPaymentDetails(payment.paymentDetails, payment.paymentMethod, payment)}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <span className={`mr-2 rounded-full w-2 h-2 ${getStatusColor(payment.status)}`}></span>
                              {payment.status}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(payment.date)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {filterPaymentsByStatus(tab).length === 0 && (
                  <div className="text-center py-16 bg-card rounded-xl shadow-sm">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-semibold text-primary mb-3">No Payments Found</h3>
                    <p className="text-muted-foreground">No payments match your search criteria.</p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Payments;
