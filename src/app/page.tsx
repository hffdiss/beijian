import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [totalItems, totalValue, lowStockItems, expiringItems, recentTxns] =
    await Promise.all([
      prisma.item.count(),
      prisma.item.aggregate({
        _sum: { quantity: true },
        _count: true,
      }),
      prisma.item.findMany({
        where: { safetyStock: { gt: 0 } },
        orderBy: { quantity: "asc" },
      }).then((list) => list.filter((i) => i.quantity <= i.safetyStock).slice(0, 10)),
      prisma.item.findMany({
        where: {
          warrantyEnd: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { warrantyEnd: "asc" },
        take: 10,
      }),
      prisma.transaction.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { item: { select: { name: true, code: true, unit: true } } },
      }),
    ]);

  // 计算本月出入库
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthTxns = await prisma.transaction.groupBy({
    by: ["type"],
    where: { createdAt: { gte: startOfMonth } },
    _count: true,
  });
  const inCount = monthTxns.find((t) => t.type === "IN")?._count ?? 0;
  const outCount = monthTxns.find((t) => t.type === "OUT")?._count ?? 0;

  // 估算库存总值
  const items = await prisma.item.findMany({
    where: { price: { not: null } },
    select: { price: true, quantity: true },
  });
  const estimatedValue = items.reduce(
    (sum, i) => sum + (i.price ?? 0) * i.quantity, 0
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">仪表盘</h1>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">物料总数</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">库存总值</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">¥{estimatedValue.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">本月入库</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{inCount} 次</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">本月出库</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">{outCount} 次</p>
          </CardContent>
        </Card>
      </div>

      {/* 快捷操作 */}
      <div className="flex gap-3 mb-6">
        <Link href="/transactions/in">
          <Button>入库</Button>
        </Link>
        <Link href="/transactions/out">
          <Button variant="secondary">出库</Button>
        </Link>
        <Link href="/stocktake">
          <Button variant="outline">盘点</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 低库存预警 */}
        <Card>
          <CardHeader>
            <CardTitle>低库存预警</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <p className="text-muted-foreground text-sm">暂无低库存物料</p>
            ) : (
              <div className="space-y-2">
                {lowStockItems.map((item) => (
                  <Link key={item.id} href={`/items/${item.id}`}>
                    <div className="flex justify-between items-center py-1 hover:bg-muted/50 px-2 rounded">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground text-sm ml-2">
                          ({item.code})
                        </span>
                      </div>
                      <Badge variant="destructive">
                        {item.quantity}/{item.safetyStock} {item.unit}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 维保到期提醒 */}
        <Card>
          <CardHeader>
            <CardTitle>维保到期提醒（30天内）</CardTitle>
          </CardHeader>
          <CardContent>
            {expiringItems.length === 0 ? (
              <p className="text-muted-foreground text-sm">暂无即将到期的维保</p>
            ) : (
              <div className="space-y-2">
                {expiringItems.map((item) => {
                  const days = Math.ceil(
                    (new Date(item.warrantyEnd!).getTime() - Date.now()) / 86400000
                  );
                  return (
                    <Link key={item.id} href={`/items/${item.id}`}>
                      <div className="flex justify-between items-center py-1 hover:bg-muted/50 px-2 rounded">
                        <span className="font-medium">{item.name}</span>
                        <Badge variant={days < 7 ? "destructive" : "outline"}>
                          {days} 天后到期
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 最近出入库 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>最近出入库</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentTxns.map((txn) => (
              <div
                key={txn.id}
                className="flex justify-between items-center py-1 border-b last:border-0"
              >
                <div>
                  <Badge
                    variant={txn.type === "IN" ? "default" : "secondary"}
                    className="mr-2"
                  >
                    {txn.type === "IN" ? "入库" : "出库"}
                  </Badge>
                  <span>{txn.item.name}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {txn.quantity} {txn.item.unit}
                  {" "}
                  {new Date(txn.createdAt).toLocaleDateString("zh-CN")}
                </div>
              </div>
            ))}
            {recentTxns.length === 0 && (
              <p className="text-center text-muted-foreground py-4">暂无记录</p>
            )}
          </div>
          <Link href="/transactions/history" className="text-sm hover:underline mt-2 inline-block">
            查看全部 &rarr;
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
