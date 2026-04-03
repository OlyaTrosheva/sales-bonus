/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет выручки от операции
  const { discount, sale_price, quantity } = purchase;

  // переводим скидку в число
  const discountRate = discount / 100;

  // полная стоимость
  const totalPrice = sale_price * quantity;

  // итог с учетом скидки
  const revenue = totalPrice * (1 - discountRate);

  return revenue;
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

  // 1 место (index 0)
  if (index === 0) {
    return profit * 0.15;
  }

  // 2 и 3 место (index 1 и 2)
  if (index === 1 || index === 2) {
    return profit * 0.1;
  }

  // последнее место
  if (index === total - 1) {
    return 0;
  }

  // все остальные
  return profit * 0.05;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  if (
    !data || // данные вообще не переданы
    !Array.isArray(data.sellers) || // продавцы не массив
    data.sellers.length === 0 || // массив продавцов пустой
    !Array.isArray(data.products) || // продукты не массив
    data.products.length === 0 || // продукты пустые
    !Array.isArray(data.purchase_records) || // чеки не массив
    data.purchase_records.length === 0 // чеки пустые
  ) {
    throw new Error("Некорректные входные данные");
  }

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
    productsMap[product.id] = product;
  });

  // @TODO: Расчет выручки и прибыли для каждого продавца

  purchase_records.forEach((record) => {
    const seller = sellerStats[record.seller_id];
    record.items.forEach((item) => {
      const product = productsMap[item.product_id];
      const revenue = calculateRevenue(item, product);
      seller.revenue += revenue;
      seller.profit += revenue;
      seller.sales_count += item.quantity;
      if (!seller.products_sold[item.product_id]) {
        seller.products_sold[item.product_id] = 0;
      }
      seller.products_sold[item.product_id] += item.quantity;
    });
  });

  // @TODO: Сортировка продавцов по прибыли

  const sortedSellers = Object.values(sellerStats).sort(
    (a, b) => b.profit - a.profit,
  );

  // @TODO: Назначение премий на основе ранжирования

  const result = sortedSellers.map((seller, index) => {
    const bonus = calculateBonus(index, sortedSellers.length, seller);
  /* return { ...seller, bonus }; */

  const top_products = Object.entries(seller.products_sold)
    .map(([sku, quantity]) => ({ sku, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  return {
    seller_id: seller.id,
    name: seller.name,
    revenue: +seller.revenue.toFixed(2),
    profit: +seller.profit.toFixed(2),
    sales_count: seller.sales_count,
    top_products,
    bonus: +bonus.toFixed(2),
  };
  });

  // @TODO: Подготовка итоговой коллекции с нужными полями
  return result;
}
