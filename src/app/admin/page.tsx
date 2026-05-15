import { db } from '@/lib/db';
import Link from 'next/link';
import {
  TrendingUp, ShoppingBag, Users, Package, IndianRupee,
  AlertTriangle, Clock, CheckCircle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getStats() {
  try {
    const [
      totalRevenue,
      totalOrders,
      todayOrders,
      pendingOrders,
      totalCustomers,
      lowStockCount,
      recentOrders,
    ] = await Promise.all([
      db.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { totalAmount: true },
      }),
      db.order.count(),
      db.order.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      db.order.count({ where: { status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING'] } } }),
      db.user.count({ where: { role: 'CUSTOMER' } }),
      db.productVariant.count({ where: { stock: { lte: 5 } } }),
      db.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);

    return {
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalOrders,
      todayOrders,
      pendingOrders,
      totalCustomers,
      lowStockCount,
      recentOrders,
    };
  } catch {
    return {
      totalRevenue: 0,
      totalOrders: 0,
      todayOrders: 0,
      pendingOrders: 0,
      totalCustomers: 0,
      lowStockCount: 0,
      recentOrders: [] as any[],
    };
  }
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-navy-900">Dashboard</h1>
        <p className="font-body text-sm text-gray-600 mt-1">Welcome back — here's how the store is doing</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={IndianRupee}
          label="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`}
          color="green"
        />
        <StatCard
          icon={ShoppingBag}
          label="Total Orders"
          value={stats.totalOrders.toString()}
          color="navy"
          subtitle={`${stats.todayOrders} today`}
        />
        <StatCard
          icon={Users}
          label="Customers"
          value={stats.totalCustomers.toString()}
          color="gold"
        />
        <StatCard
          icon={AlertTriangle}
          label="Low Stock Items"
          value={stats.lowStockCount.toString()}
          color="red"
          subtitle="Need restocking"
          href="/admin/inventory?filter=low"
        />
      </div>

      {/* Pending Actions */}
      {stats.pendingOrders > 0 && (
        <div className="bg-gold-50 border-l-4 border-gold-500 p-4 rounded mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-gold-600" />
            <div>
              <p className="font-body font-semibold text-navy-900">
                {stats.pendingOrders} order{stats.pendingOrders > 1 ? 's' : ''} pending
              </p>
              <p className="font-body text-xs text-gray-600">
                Confirm and process them to keep customers happy.
              </p>
            </div>
          </div>
          <Link href="/admin/orders?status=pending" className="font-body text-sm font-semibold text-gold-700 hover:text-gold-800">
            View →
          </Link>
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="p-5 border-b border-cream-200 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-navy-900">Recent Orders</h2>
          <Link href="/admin/orders" className="font-body text-sm text-gold-600 hover:text-gold-700">
            View all →
          </Link>
        </div>
        <table className="w-full">
          <thead className="bg-cream-50 text-xs font-body uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-5 py-3 text-left">Order</th>
              <th className="px-5 py-3 text-left">Customer</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-right">Amount</th>
              <th className="px-5 py-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentOrders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center font-body text-sm text-gray-500">
                  No orders yet. Once customers buy, they'll show here.
                </td>
              </tr>
            )}
            {stats.recentOrders.map((order: any) => (
              <tr key={order.id} className="border-t border-cream-100 hover:bg-cream-50">
                <td className="px-5 py-3 font-body text-sm font-medium text-gold-700">
                  #{order.orderNumber}
                </td>
                <td className="px-5 py-3 font-body text-sm text-navy-900">
                  {order.user.name}
                  <p className="text-xs text-gray-500">{order.user.email}</p>
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-5 py-3 text-right font-display font-semibold text-navy-900">
                  ₹{order.totalAmount.toLocaleString('en-IN')}
                </td>
                <td className="px-5 py-3 font-body text-xs text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, color, subtitle, href,
}: {
  icon: any; label: string; value: string; color: string; subtitle?: string; href?: string;
}) {
  const colors: Record<string, string> = {
    green: 'bg-green-50 text-green-600',
    navy: 'bg-navy-50 text-navy-700',
    gold: 'bg-gold-50 text-gold-600',
    red: 'bg-red-50 text-red-600',
  };
  const Content = (
    <div className="bg-white rounded-lg shadow-card p-5 hover:shadow-card-hover transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <p className="font-body text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="font-display text-2xl font-semibold text-navy-900">{value}</p>
      {subtitle && <p className="font-body text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
  return href ? <Link href={href}>{Content}</Link> : Content;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    PROCESSING: 'bg-purple-100 text-purple-700',
    SHIPPED: 'bg-indigo-100 text-indigo-700',
    DELIVERED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-body font-semibold ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}
