# docker-compose build
# docker-compose up
# docker-compose down

<!-- https://www.cfin.ru/finmarket/open_interest.shtml -->
todo backtest idea:
```
число открытых позиций растет, цена растет — бычий признак;
число открытых позиций растет, цена снижается — медвежий признак;
число открытых позиций снижается, цена растет — медвежий признак;
число открытых позиций снижается, цена снижается — бычий признак.
```

todo

добавить цену акции/фьюча , так же посмотреть на расхождение цены акции и фьюча

добавить свою интерпретацию коэффициентов legalLongToFizLong legalShortToFizShort legalShortToFizLong legalLongToFizShort


сделать на графике в точках данные - сколько клиентов в позиции


npx prisma generate 
npx prisma db push --force-reset