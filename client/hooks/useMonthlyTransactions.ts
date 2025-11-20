import { useState, useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { transactionsApi } from '../services/api';
import { Transaction } from '../types';

export const useMonthlyTransactions = (userId?: string) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const queryClient = useQueryClient();

    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        refetch
    } = useInfiniteQuery({
        queryKey: ['transactions', userId, month, year],
        queryFn: ({ pageParam = 1 }) =>
            transactionsApi.list({
                page: pageParam as number,
                limit: 10,
                month,
                year
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            return lastPage.meta.hasMore ? lastPage.meta.page + 1 : undefined;
        },
        enabled: !!userId,
    });

    const transactions = data?.pages.flatMap((page) => page.data) || [];

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    // Prefetch adjacent months for smoother transitions
    useEffect(() => {
        if (userId) {
            const prevMonth = month === 0 ? 11 : month - 1;
            const prevYear = month === 0 ? year - 1 : year;

            const nextMonth = month === 11 ? 0 : month + 1;
            const nextYear = month === 11 ? year + 1 : year;

            queryClient.prefetchInfiniteQuery({
                queryKey: ['transactions', userId, prevMonth, prevYear],
                queryFn: () => transactionsApi.list({ page: 1, limit: 10, month: prevMonth, year: prevYear }),
                initialPageParam: 1,
            });

            queryClient.prefetchInfiniteQuery({
                queryKey: ['transactions', userId, nextMonth, nextYear],
                queryFn: () => transactionsApi.list({ page: 1, limit: 10, month: nextMonth, year: nextYear }),
                initialPageParam: 1,
            });
        }
    }, [month, year, userId, queryClient]);

    return {
        transactions,
        currentDate,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        goToPreviousMonth,
        goToNextMonth,
        refetch
    };
};
