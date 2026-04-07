/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  const { discount, sale_price, quantity } = purchase;

  return sale_price * quantity * (1 - discount / 100);
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  // @TODO: Расчет бонуса от позиции в рейтинге
  const { profit } = seller;
  let bonus;

  if (index === 0) {
    bonus = profit * 0.15;
  } else if (index === 1 || index === 2) {
    bonus = profit * 0.1;
  } else if (index === total - 1) {
    bonus = 0;
  } else {
    bonus = profit * 0.05;
  }

  // округляем бонус до двух знаков
  bonus = Math.round(bonus * 100) / 100;

  return bonus;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */

function analyzeSalesData(data, options) {
  // @TODO: Проверка входных данных
  if (!data) {
    throw new Error("Нет данных");
  }
  const { sellers, products, purchase_records } = data;

  if (!Array.isArray(sellers) || sellers.length === 0) {
    throw new Error("Некорректные данные продавцов");
  }

  if (!Array.isArray(products) || products.length === 0) {
    throw new Error("Некорректные данные продуктов");
  }

  if (!Array.isArray(purchase_records) || purchase_records.length === 0) {
    throw new Error("Некорректные данные продаж");
  }
  // @TODO: Проверка наличия опций
  if (!options) {
    throw new Error("Нет настроек");
  }

  const { calculateRevenue, calculateBonus } = options;

  if (typeof calculateRevenue !== "function") {
    throw new Error("Функция calculateRevenue не передана");
  }

  if (typeof calculateBonus !== "function") {
    throw new Error("Функция calculateBonus не передана");
  }
  // @TODO: Подготовка промежуточных данных для сбора статистики
  const sellerStats = {};

  sellers.forEach((seller) => {
    sellerStats[seller.id] = {
      id: seller.id,
      name: `${seller.first_name} ${seller.last_name}`,
      revenue: 0,
      profit: 0,
      sales_count: 0,
      products_sold: {},
    };
  });

  // @TODO: Индексация продавцов и товаров для быстрого доступа
  const productsMap = {};

  products.forEach((product) => {
    productsMap[product.sku] = product;
  });

  // @TODO: Расчет выручки и прибыли для каждого продавца
  purchase_records.forEach((record) => {
    const seller = sellerStats[record.seller_id];

    if (!seller) {
      throw new Error(`Продавец ${record.seller_id} не найден`);
    }

    seller.sales_count += 1;

    record.items.forEach((item) => {
      const product = productsMap[item.sku];

      if (!product) {
        throw new Error(`Продукт с SKU ${item.sku} не найден`);
      }

      const discount = item.discount || 0;

      const revenue = product.price * item.quantity * (1 - discount);

      const profit =
        (product.price - product.purchase_price) *
        item.quantity *
        (1 - discount);

      seller.revenue += revenue;
      seller.profit += profit;

      /* seller.revenue = Math.round((seller.revenue + revenue) * 100) / 100;
      seller.profit = Math.round((seller.profit + profit) * 100) / 100; */

      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }

      seller.products_sold[item.sku] += item.quantity;
    });
  });

  // @TODO: Сортировка продавцов по прибыли

  const sortedSellers = Object.values(sellerStats).sort(
    (a, b) => b.profit - a.profit,
  );

  // @TODO: Назначение премий на основе ранжирования

  return sortedSellers.map((seller, index) => {
    // Рассчитываем бонус на основании исходного seller.profit
    const bonus = calculateBonus(index, sortedSellers.length, seller);

    // Составляем топ-продаж
    const top_products = Object.entries(seller.products_sold)
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return {
      seller_id: seller.id,
      name: seller.name,
      // Округляем до 2 знаков ТОЛЬКО здесь при выводе
      revenue: Number(seller.revenue.toFixed(2)),
      profit: Number(seller.profit.toFixed(2)),
      sales_count: seller.sales_count,
      top_products,
      bonus: Math.round(bonus * 100) / 100,
    };
  });
  // @TODO: Подготовка итоговой коллекции с нужными полями
}
