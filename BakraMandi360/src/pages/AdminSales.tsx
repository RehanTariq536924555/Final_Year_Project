
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet, Search, Calendar, ArrowUpDown, Download, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import axios from 'axios';
import { toast } from 'sonner';

interface Sale {
  id: string;
  orderId: string;
  items: { id: string; title: string; price: number }[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  paymentDetails: { bankName?: string; accountNumber?: string } | null;
  status: string;
  animalType: string | null;
  breed: string | null;
  buyer: string | null;
  seller: string | null;
  date: string | null;
}

const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSales = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('http://localhost:3001/payment/admin/all');
        console.log("=== SALES DATA FROM API ===");
        console.log("Raw sales data:", response.data);
        
        if (response.data && response.data.length > 0) {
          console.log("Sample sale:", response.data[0]);
          console.log("Available keys:", Object.keys(response.data[0]));
        }
        
        // Transform the data to ensure proper structure
        const transformedSales = response.data.map((sale: any, index: number) => {
          console.log(`\n=== Processing Sale ${index + 1} ===`);
          console.log("Raw sale data:", sale);
          
          // Extract total with multiple fallbacks
          let total = 0;
          if (sale.total && typeof sale.total === 'number') {
            total = sale.total;
          } else if (sale.amount && typeof sale.amount === 'number') {
            total = sale.amount;
          } else if (sale.price && typeof sale.price === 'number') {
            total = sale.price;
          } else if (sale.subtotal && typeof sale.subtotal === 'number') {
            total = sale.subtotal + (sale.tax || 0);
          }
          
          // Extract subtotal
          let subtotal = sale.subtotal || total - (sale.tax || 0) || total;
          
          // Extract tax
          let tax = sale.tax || 0;
          
          // If we still don't have a total, calculate from items
          if (total === 0 && sale.items && Array.isArray(sale.items)) {
            total = sale.items.reduce((sum: number, item: any) => sum + (item.price || 0), 0);
            subtotal = total;
          }
          
          const transformedSale = {
            id: sale.id || `sale_${index + 1}`,
            orderId: sale.orderId || sale.orderNumber || sale.id || `ORD-${index + 1}`,
            items: sale.items || [{ id: '1', title: 'Unknown Item', price: total }],
            subtotal: subtotal,
            tax: tax,
            total: total,
            paymentMethod: sale.paymentMethod || sale.method || 'Unknown',
            paymentDetails: sale.paymentDetails || null,
            status: sale.status || 'Completed',
            animalType: sale.animalType || null,
            breed: sale.breed || null,
            buyer: sale.buyer || sale.buyerName || 'Unknown Buyer',
            seller: sale.seller || sale.sellerName || 'Unknown Seller',
            date: sale.date || sale.createdAt || new Date().toISOString(),
          };
          
          console.log("Transformed sale:", transformedSale);
          return transformedSale;
        });
        
        setSales(transformedSales);
      } catch (error) {
        console.error('Error fetching sales:', error);
        toast.error('Failed to load sales data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSales();
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: 'Completed' | 'Cancelled') => {
    try {
      console.log(`Admin updating order ${orderId} to ${newStatus}`);
      await axios.patch(`http://localhost:3001/payment/${orderId}/status`, { status: newStatus });
      setSales(sales.map(sale => 
        sale.orderId === orderId ? { ...sale, status: newStatus } : sale
      ));
      const actionText = newStatus === 'Completed' ? 'accepted' : 'cancelled';
      toast.success(`Order ${orderId.slice(0, 8)} ${actionText} successfully`);
    } catch (error) {
      console.error(`Error updating order ${orderId}:`, error);
      const actionText = newStatus === 'Completed' ? 'accept' : 'cancel';
      toast.error(`Failed to ${actionText} order ${orderId.slice(0, 8)}. Please try again.`);
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      console.log(`Admin cancelling order ${orderId}`);
      await axios.patch(`http://localhost:3001/payment/${orderId}/status`, { status: 'Cancelled' });
      setSales(sales.map(sale => 
        sale.orderId === orderId ? { ...sale, status: 'Cancelled' } : sale
      ));
      toast.success(`Order ${orderId.slice(0, 8)} cancelled successfully`);
    } catch (error) {
      console.error(`Error cancelling order ${orderId}:`, error);
      toast.error(`Failed to cancel order ${orderId.slice(0, 8)}. Please try again.`);
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredSales = sales.filter(sale => 
    (sale.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
     sale.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (sale.buyer && sale.buyer.toLowerCase().includes(searchTerm.toLowerCase())) ||
     (sale.seller && sale.seller.toLowerCase().includes(searchTerm.toLowerCase())) ||
     (sale.animalType && sale.animalType.toLowerCase().includes(searchTerm.toLowerCase())) ||
     (sale.breed && sale.breed.toLowerCase().includes(searchTerm.toLowerCase())) ||
     sale.items.some(item => item.title.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    (dateFilter === 'all' || (sale.date && filterByDate(sale.date, dateFilter)))
  );

  function filterByDate(dateStr: string, filter: string) {
    const saleDate = new Date(dateStr);
    const today = new Date();
    
    today.setHours(0, 0, 0, 0);
    
    if (filter === 'today') {
      return saleDate.toDateString() === today.toDateString();
    } else if (filter === 'week') {
      const oneWeekAgo = new Date(today);
      oneWeekAgo.setDate(today.getDate() - 7);
      return saleDate >= oneWeekAgo;
    } else if (filter === 'month') {
      const oneMonthAgo = new Date(today);
      oneMonthAgo.setMonth(today.getMonth() - 1);
      return saleDate >= oneMonthAgo;
    }
    return true;
  }

  const sortedSales = [...filteredSales].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const direction = sortDirection === 'asc' ? 1 : -1;
    
    switch (sortColumn) {
      case 'orderId':
        return direction * a.orderId.localeCompare(b.orderId);
      case 'subtotal':
        return direction * (a.subtotal - b.subtotal);
      case 'tax':
        return direction * (a.tax - b.tax);
      case 'total':
        return direction * (a.total - b.total);
      case 'paymentMethod':
        return direction * a.paymentMethod.localeCompare(b.paymentMethod);
      case 'status':
        return direction * a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'Rs. 0';
    }
    return `Rs. ${amount.toLocaleString('en-PK')}`;
  };

  const formatItems = (items: { id: string; title: string; price: number }[]) => {
    return items.map(item => item.title).join(', ');
  };

  const formatPaymentDetails = (details: any, paymentMethod?: string) => {
    console.log("=== SALES PAYMENT DETAILS DEBUG ===");
    console.log("Payment details:", details);
    console.log("Payment method:", paymentMethod);
    
    if (!details) {
      // If no details object, try to create meaningful info from payment method
      switch (paymentMethod?.toLowerCase()) {
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
          return paymentMethod ? `${paymentMethod} Payment` : 'Payment Completed';
      }
    }
    
    // Handle different possible structures of payment details
    if (typeof details === 'string') {
      return details;
    }
    
    if (typeof details === 'object') {
      // Try various possible field combinations
      if (details.bankName && details.accountNumber) {
        return `Bank: ${details.bankName}, Account: ${details.accountNumber}`;
      }
      if (details.bank && details.account) {
        return `Bank: ${details.bank}, Account: ${details.account}`;
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
    return paymentMethod ? `${paymentMethod} Payment` : 'Payment Completed';
  };

  const filterSalesByTab = (sales: Sale[], tab: string) => {
    if (tab === 'all') return sales;
    return sales.filter(sale => sale.status.toLowerCase() === tab.toLowerCase());
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="py-4 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between border-b bg-card/50 sticky top-0 z-10 backdrop-blur">
        <div className="flex items-center gap-3 mb-4 sm:mb-0">
          <FileSpreadsheet className="h-6 w-6 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-semibold text-primary font-quicksand">Sales History</h1>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search sales..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary font-roboto"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative w-full sm:w-40">
            <select
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary font-roboto appearance-none"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | 'week' | 'month')}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          {/* <Button
            className="bg-teal-600 hover:bg-teal-700 text-white w-full sm:w-auto rounded-lg font-roboto"
            onClick={() => toast.info('Export functionality coming soon!')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button> */}
          {/* <Button
            variant="outline"
            className="border-red-500 text-red-500 hover:bg-red-50 w-full sm:w-auto rounded-lg font-roboto"
            onClick={() => navigate('/orders')}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button> */}
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {isLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-muted-foreground font-roboto">Loading sales...</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl shadow-sm">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <FileSpreadsheet className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold text-primary mb-3 font-quicksand">No Sales Found</h3>
            <p className="text-muted-foreground font-roboto">No sales data available yet.</p>
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-6 flex flex-wrap justify-center sm:justify-start bg-muted rounded-xl p-1.5 shadow-sm">
              <TabsTrigger
                value="all"
                className="px-4 py-2 text-sm font-roboto data-[state=active]:bg-primary data-[state=active]:text-white hover:bg-muted-foreground/20 rounded-lg transition-all duration-300"
              >
                All Sales
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="px-4 py-2 text-sm font-roboto data-[state=active]:bg-primary data-[state=active]:text-white hover:bg-muted-foreground/20 rounded-lg transition-all duration-300"
              >
                Completed
              </TabsTrigger>
              <TabsTrigger
                value="pending"
                className="px-4 py-2 text-sm font-roboto data-[state=active]:bg-primary data-[state=active]:text-white hover:bg-muted-foreground/20 rounded-lg transition-all duration-300"
              >
                Pending
              </TabsTrigger>
              <TabsTrigger
                value="cancelled"
                className="px-4 py-2 text-sm font-roboto data-[state=active]:bg-primary data-[state=active]:text-white hover:bg-muted-foreground/20 rounded-lg transition-all duration-300"
              >
                Cancelled
              </TabsTrigger>
            </TabsList>
            
            {['all', 'completed', 'pending', 'cancelled'].map(tab => (
              <TabsContent key={tab} value={tab} className="space-y-4">
                <div className="rounded-xl border border-input bg-card shadow-md overflow-x-auto">
                  <Table className="min-w-full table-auto">
                    <TableHeader>
                      <TableRow className="bg-muted">
                        <TableHead className="text-xs sm:text-sm font-roboto text-muted-foreground whitespace-nowrap px-4 py-3">ID</TableHead>
                        <TableHead className="text-xs sm:text-sm font-roboto text-muted-foreground whitespace-nowrap px-4 py-3">Items</TableHead>
                        <TableHead onClick={() => handleSort('orderId')} className="cursor-pointer text-xs sm:text-sm font-roboto text-muted-foreground whitespace-nowrap px-4 py-3">
                          <div className="flex items-center">
                            Order ID
                            {sortColumn === 'orderId' && (
                              <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                            )}
                          </div>
                        </TableHead>
                        <TableHead onClick={() => handleSort('subtotal')} className="cursor-pointer text-xs sm:text-sm font-roboto text-muted-foreground whitespace-nowrap px-4 py-3">
                          <div className="flex items-center">
                            Subtotal
                            {sortColumn === 'subtotal' && (
                              <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                            )}
                          </div>
                        </TableHead>
                        <TableHead onClick={() => handleSort('tax')} className="cursor-pointer text-xs sm:text-sm font-roboto text-muted-foreground whitespace-nowrap px-4 py-3">
                          <div className="flex items-center">
                            Tax
                            {sortColumn === 'tax' && (
                              <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                            )}
                          </div>
                        </TableHead>
                        <TableHead onClick={() => handleSort('total')} className="cursor-pointer text-xs sm:text-sm font-roboto text-muted-foreground whitespace-nowrap px-4 py-3">
                          <div className="flex items-center">
                            Total
                            {sortColumn === 'total' && (
                              <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                            )}
                          </div>
                        </TableHead>
                        <TableHead onClick={() => handleSort('paymentMethod')} className="cursor-pointer text-xs sm:text-sm font-roboto text-muted-foreground whitespace-nowrap px-4 py-3">
                          <div className="flex items-center">
                            Payment Method
                            {sortColumn === 'paymentMethod' && (
                              <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="text-xs sm:text-sm font-roboto text-muted-foreground whitespace-nowrap px-4 py-3">Payment Details</TableHead>
                        <TableHead onClick={() => handleSort('status')} className="cursor-pointer text-xs sm:text-sm font-roboto text-muted-foreground whitespace-nowrap px-4 py-3">
                          <div className="flex items-center">
                            Status
                            {sortColumn === 'status' && (
                              <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="text-xs sm:text-sm font-roboto text-muted-foreground whitespace-nowrap px-4 py-3">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterSalesByTab(sortedSales, tab)
                        .map((sale) => {
                          console.log("=== SALES DEBUG ===");
                          console.log("Sale data:", sale);
                          console.log("Sale total:", sale.total);
                          console.log("Sale subtotal:", sale.subtotal);
                          console.log("Sale tax:", sale.tax);
                          
                          return (
                          <TableRow key={sale.id} className="hover:bg-muted/50 transition-colors duration-200">
                            <TableCell className="text-xs sm:text-sm font-roboto text-foreground whitespace-nowrap px-4 py-3">{sale.id}</TableCell>
                            <TableCell className="text-xs sm:text-sm font-roboto text-foreground px-4 py-3">{formatItems(sale.items)}</TableCell>
                            <TableCell className="text-xs sm:text-sm font-roboto text-foreground whitespace-nowrap px-4 py-3">{sale.orderId}</TableCell>
                            <TableCell className="text-xs sm:text-sm font-roboto text-foreground whitespace-nowrap px-4 py-3">{formatCurrency(sale.subtotal || 0)}</TableCell>
                            <TableCell className="text-xs sm:text-sm font-roboto text-foreground whitespace-nowrap px-4 py-3">{formatCurrency(sale.tax || 0)}</TableCell>
                            <TableCell className="text-xs sm:text-sm font-roboto text-foreground whitespace-nowrap px-4 py-3 font-semibold">{formatCurrency(sale.total || 0)}</TableCell>
                            <TableCell className="text-xs sm:text-sm font-roboto text-foreground whitespace-nowrap px-4 py-3">{sale.paymentMethod}</TableCell>
                            <TableCell className="text-xs sm:text-sm font-roboto text-foreground whitespace-nowrap px-4 py-3">{formatPaymentDetails(sale.paymentDetails, sale.paymentMethod)}</TableCell>
                            <TableCell className="text-xs sm:text-sm font-roboto whitespace-nowrap px-4 py-3">
                              <div className="flex items-center">
                                <span className={`mr-2 rounded-full w-2 h-2 ${
                                  sale.status === 'Completed' ? 'bg-green-500' :
                                  sale.status === 'Pending' ? 'bg-yellow-500' :
                                  sale.status === 'Cancelled' ? 'bg-red-500' : 'bg-gray-500'
                                }`}></span>
                                {sale.status}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm whitespace-nowrap px-4 py-3">
                              <div className="flex gap-2">
                                {sale.status !== 'Completed' && (
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white rounded-lg font-roboto"
                                    onClick={() => updateOrderStatus(sale.orderId, 'Completed')}
                                    disabled={sale.status === 'Completed'}
                                  >
                                    Accept
                                  </Button>
                                )}
                                {sale.status !== 'Cancelled' && (
                                  <Button
                                    size="sm"
                                    className="bg-red-600 hover:bg-red-700 text-white rounded-lg font-roboto"
                                    onClick={() => deleteOrder(sale.orderId)}
                                  >
                                    Cancel Order
                                  </Button>
                                )}
                                {sale.status === 'Completed' && (
                                  <span className="text-green-600 font-semibold text-xs">Accepted</span>
                                )}
                                {sale.status === 'Cancelled' && (
                                  <span className="text-red-600 font-semibold text-xs">Cancelled</span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
                
                {filterSalesByTab(sortedSales, tab).length === 0 && (
                  <div className="text-center py-16 bg-card rounded-xl shadow-sm">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileSpreadsheet className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-semibold text-primary mb-3 font-quicksand">No Sales Found</h3>
                    <p className="text-muted-foreground font-roboto">No sales match your search criteria.</p>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row justify-between items-center pt-6 gap-4">
                  <div className="text-sm text-muted-foreground font-roboto">
                    Showing {filterSalesByTab(sortedSales, tab).length} of {sales.length} sales
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-input text-foreground hover:bg-muted rounded-lg font-roboto"
                      disabled
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-input text-foreground hover:bg-muted rounded-lg font-roboto"
                      disabled
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Sales;
