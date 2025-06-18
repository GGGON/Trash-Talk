'use client';

import { WalletConnect } from '@/components/WalletConnect';
import { useAccount, useContractRead, useContractWrite, useWaitForTransactionReceipt } from 'wagmi';
import { HISTORY_ABI, HISTORY_CONTRACT_ADDRESS } from '@/lib/blockchain/contracts';
import { useState, useEffect } from 'react';
import Head from 'next/head';

interface HistoryRecord {
  id: bigint;
  content: string;
  author: string;
  timestamp: number;
  tags: string[];
  category: string;
  likes: number;
  isVerified: boolean;
}

interface SearchFilters {
  startTime: string;
  endTime: string;
  author: string;
  content: string;
}

interface Comment {
  id: bigint;
  author: string;
  content: string;
  timestamp: number;
}

export default function Home() {
  const { isConnected, address } = useAccount();
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    startTime: '',
    endTime: '',
    author: '',
    content: ''
  });
  const [searchResults, setSearchResults] = useState<HistoryRecord[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentSearchArgs, setCurrentSearchArgs] = useState<[bigint, bigint, string, `0x${string}`]>(
    [BigInt(0), BigInt(0), "", "0x0000000000000000000000000000000000000000" as `0x${string}`]
  );
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [categorySearchInput, setCategorySearchInput] = useState('');
  const [tagSearchInput, setTagSearchInput] = useState('');
  const [categoryRecords, setCategoryRecords] = useState<HistoryRecord[]>([]);
  const [tagRecords, setTagRecords] = useState<HistoryRecord[]>([]);
  const [currentCategorySearchTerm, setCurrentCategorySearchTerm] = useState<string>('');
  const [currentTagSearchTerm, setCurrentTagSearchTerm] = useState<string>('');
  const [isCategorySearching, setIsCategorySearching] = useState(false);
  const [isTagSearching, setIsTagSearching] = useState(false);
  const [selectedRecordIdForComments, setSelectedRecordIdForComments] = useState<bigint | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentContent, setCommentContent] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [lastSubmittedCommentContent, setLastSubmittedCommentContent] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSearchSection, setShowSearchSection] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const [defaultSearchRecords, setDefaultSearchRecords] = useState<HistoryRecord[]>([]);
  const [isDefaultSearching, setIsDefaultSearching] = useState(true);
  // 历史记录内容展开状态
  const [expandedRecords, setExpandedRecords] = useState<Record<string, boolean>>({});
  // 语言切换
  const [lang, setLang] = useState<'zh' | 'en'>('en');
  const texts = {
    zh: {
      title: 'Trash Talk',
      write: '撰写新内容',
      hideWrite: '隐藏撰写内容',
      search: '搜索历史记录',
      hideSearch: '隐藏搜索条件',
      submit: '提交记录',
      submitting: '提交中...',
      submitSuccess: '记录提交成功!',
      error: '错误',
      content: '内容:',
      tags: '标签 (以逗号分隔):',
      category: '类别:',
      startTime: '开始时间:',
      endTime: '结束时间:',
      author: '作者地址:',
      keyword: '内容关键词:',
      searchBtn: '搜索',
      searching: '搜索中...',
      reset: '重置',
      categorySearch: '按分类搜索:',
      tagSearch: '按标签搜索:',
      searchCategory: '搜索分类',
      searchTag: '搜索标签',
      categoryResult: '分类搜索结果:',
      tagResult: '标签搜索结果:',
      records: '历史记录',
      loading: '正在加载最近的历史记录...',
      noRecent: '暂无最近的历史记录。',
      noResult: '没有找到符合条件的记录。',
      noComment: '暂无评论。',
      comment: '评论:',
      addComment: '添加评论',
      addingComment: '提交评论中...',
      prev: '上一页',
      next: '下一页',
      page: '页码',
      copy: '已复制!',
      showComment: '查看/添加评论',
      hideComment: '隐藏评论',
      submitComment: '添加评论',
      connectWallet: '连接钱包',
      pleaseConnect: '请连接钱包以查看和提交历史记录。',
      loadingSearch: '正在搜索...',
      expand: '展开',
      collapse: '收起',
      placeholderContent: '在此输入历史记录内容...',
      placeholderTags: '例如: 历史, 事件, 人物',
      placeholderCategory: '例如: 政治, 经济, 文化',
      placeholderAuthor: '输入作者地址 (0x...)',
      placeholderKeyword: '输入内容关键词',
      placeholderCategorySearch: '输入分类名称',
      placeholderTagSearch: '输入标签名称',
      placeholderComment: '添加评论...',
      recent3days: '刷新最近3天',
      refreshing: '刷新中...'
    },
    en: {
      title: 'Trash Talk',
      write: 'Write New',
      hideWrite: 'Hide Write',
      search: 'Search History',
      hideSearch: 'Hide Search',
      submit: 'Submit',
      submitting: 'Submitting...',
      submitSuccess: 'Record submitted!',
      error: 'Error',
      content: 'Content:',
      tags: 'Tags (comma separated):',
      category: 'Category:',
      startTime: 'Start Time:',
      endTime: 'End Time:',
      author: 'Author Address:',
      keyword: 'Keyword:',
      searchBtn: 'Search',
      searching: 'Searching...',
      reset: 'Reset',
      categorySearch: 'Search by Category:',
      tagSearch: 'Search by Tag:',
      searchCategory: 'Search Category',
      searchTag: 'Search Tag',
      categoryResult: 'Category Results:',
      tagResult: 'Tag Results:',
      records: 'History Records',
      loading: 'Loading recent records...',
      noRecent: 'No recent records.',
      noResult: 'No records found.',
      noComment: 'No comments.',
      comment: 'Comments:',
      addComment: 'Add Comment',
      addingComment: 'Submitting...',
      prev: 'Prev',
      next: 'Next',
      page: 'Page',
      copy: 'Copied!',
      showComment: 'Show/Add Comments',
      hideComment: 'Hide Comments',
      submitComment: 'Add Comment',
      connectWallet: 'Connect Wallet',
      pleaseConnect: 'Please connect wallet to view and submit records.',
      loadingSearch: 'Searching...',
      expand: 'Expand',
      collapse: 'Collapse',
      placeholderContent: 'Enter history content...',
      placeholderTags: 'e.g. history, event, person',
      placeholderCategory: 'e.g. politics, economy, culture',
      placeholderAuthor: 'Enter author address (0x...)',
      placeholderKeyword: 'Enter keyword',
      placeholderCategorySearch: 'Enter category',
      placeholderTagSearch: 'Enter tag',
      placeholderComment: 'Add a comment...',
      recent3days: 'Refresh 3 Days',
      refreshing: 'Refreshing...'
    }
  };

  const { writeContract, data: createData, isError, error: writeError } = useContractWrite();

  const { isLoading: isCreating, isSuccess } = useWaitForTransactionReceipt({
    hash: createData,
  });

  const { data: searchContractData, isFetching: isSearchFetching, error: searchError } = useContractRead({
    address: HISTORY_CONTRACT_ADDRESS as `0x${string}`,
    abi: HISTORY_ABI,
    functionName: 'searchRecords',
    args: currentSearchArgs,
    query: {
      enabled: true,
    },
  });

  const { data: categorySearchData, isFetching: isCategorySearchFetching, error: categorySearchError } = useContractRead({
    address: HISTORY_CONTRACT_ADDRESS as `0x${string}`,
    abi: HISTORY_ABI,
    functionName: 'getCategoryRecords',
    args: [currentCategorySearchTerm],
    query: {
      enabled: !!currentCategorySearchTerm,
    },
  });

  const { data: tagSearchData, isFetching: isTagSearchFetching, error: tagSearchError } = useContractRead({
    address: HISTORY_CONTRACT_ADDRESS as `0x${string}`,
    abi: HISTORY_ABI,
    functionName: 'getTagRecords',
    args: [currentTagSearchTerm],
    query: {
      enabled: !!currentTagSearchTerm,
    },
  });

  const { data: recordCommentsData, isFetching: isCommentsFetching, error: commentsError } = useContractRead({
    address: HISTORY_CONTRACT_ADDRESS as `0x${string}`,
    abi: HISTORY_ABI,
    functionName: 'getRecordComments',
    args: [selectedRecordIdForComments || BigInt(0)],
    query: {
      enabled: !!selectedRecordIdForComments,
    },
  });

  useEffect(() => {
    const defaultSearch = async () => {
      setIsDefaultSearching(true);
      const startTimestamp = getThreeDaysAgoTimestamp();
      const endTimestamp = getNowTimestamp();
      setCurrentSearchArgs([startTimestamp, endTimestamp, '', '0x0000000000000000000000000000000000000000']);
    };
    defaultSearch();
  }, []);

  useEffect(() => {
    if (!isSearchFetching) {
      setIsDefaultSearching(false);
      setIsSearching(false);
    }
    if (searchError) {
      setError(`搜索失败: ${searchError.message}`);
      setSearchResults([]);
      setDefaultSearchRecords([]);
      console.error('搜索合约调用失败:', searchError);
      return;
    }
    if (Array.isArray(searchContractData)) {
      const formattedData: HistoryRecord[] = searchContractData
        .filter((record: any) => record && record.id !== undefined)
        .map((record: any) => ({
          id: BigInt(record.id),
          content: record.content,
          author: record.author,
          timestamp: Number(record.timestamp),
          tags: record.tags,
          category: record.category,
          likes: Number(record.likes),
          isVerified: record.isVerified,
        }))
        .sort((a, b) => b.timestamp - a.timestamp);
      const isDefaultSearchCurrent =
        currentSearchArgs[2] === '' &&
        currentSearchArgs[3] === '0x0000000000000000000000000000000000000000';
      if (isDefaultSearchCurrent) {
        setDefaultSearchRecords(formattedData.slice(0, 100));
        setRecords(formattedData.slice(0, 100));
      } else {
        setSearchResults(formattedData);
        setRecords(formattedData);
      }
    }
  }, [searchContractData, isSearchFetching, searchError, currentSearchArgs]);

  useEffect(() => {
    if (!isCategorySearchFetching) {
      setIsCategorySearching(false);
    }
    if (categorySearchError) {
      setError(`分类搜索失败: ${categorySearchError.message}`);
      setCategoryRecords([]);
      console.error('分类搜索合约调用失败:', categorySearchError);
      return;
    }
    if (Array.isArray(categorySearchData)) {
      const formattedData: HistoryRecord[] = categorySearchData
        .filter((record: any) => record && record.id !== undefined)
        .map((record: any) => ({
          id: BigInt(record.id),
          content: record.content,
          author: record.author,
          timestamp: Number(record.timestamp),
          tags: record.tags,
          category: record.category,
          likes: Number(record.likes),
          isVerified: record.isVerified,
        }))
        .sort((a, b) => b.timestamp - a.timestamp);
      setCategoryRecords(formattedData);
      setRecords(formattedData);
    }
  }, [categorySearchData, isCategorySearchFetching, categorySearchError]);

  useEffect(() => {
    if (!isTagSearchFetching) {
      setIsTagSearching(false);
    }
    if (tagSearchError) {
      setError(`标签搜索失败: ${tagSearchError.message}`);
      setTagRecords([]);
      console.error('标签搜索合约调用失败:', tagSearchError);
      return;
    }
    if (Array.isArray(tagSearchData)) {
      const formattedData: HistoryRecord[] = tagSearchData
        .filter((record: any) => record && record.id !== undefined)
        .map((record: any) => ({
          id: BigInt(record.id),
          content: record.content,
          author: record.author,
          timestamp: Number(record.timestamp),
          tags: record.tags,
          category: record.category,
          likes: Number(record.likes),
          isVerified: record.isVerified,
        }))
        .sort((a, b) => b.timestamp - a.timestamp);
      setTagRecords(formattedData);
      setRecords(formattedData);
    }
  }, [tagSearchData, isTagSearchFetching, tagSearchError]);

  useEffect(() => {
    if (commentsError) {
      setError(`获取评论失败: ${commentsError.message}`);
      setComments([]);
      console.error('获取评论合约调用失败:', commentsError);
      return;
    }
    if (Array.isArray(recordCommentsData)) {
      const formattedComments: Comment[] = recordCommentsData
        .filter((comment: any) => comment && comment.id !== undefined)
        .map((comment: any) => ({
          id: BigInt(comment.id),
          author: comment.author,
          content: comment.content,
          timestamp: Number(comment.timestamp),
        }));
      setComments(formattedComments);
    }
  }, [recordCommentsData, commentsError]);

  const { writeContract: addCommentWriteContract, data: addCommentData, isPending: isAddCommentPending, error: addCommentError } = useContractWrite();

  const { isLoading: isAddingCommentTx, isSuccess: isAddCommentSuccess } = useWaitForTransactionReceipt({
    hash: addCommentData,
  });

  useEffect(() => {
    if (isAddCommentSuccess) {
      setError(null);
      if (selectedRecordIdForComments && address && lastSubmittedCommentContent !== null) {
        const newComment: Comment = {
          id: BigInt(Date.now()),
          author: address,
          content: lastSubmittedCommentContent,
          timestamp: Math.floor(Date.now() / 1000),
        };
        setComments(prevComments => [newComment, ...prevComments]);
        setLastSubmittedCommentContent(null);
      }
      if (selectedRecordIdForComments) {
        setSelectedRecordIdForComments(null);
        setTimeout(() => setSelectedRecordIdForComments(selectedRecordIdForComments), 0);
      }
    }
    if (addCommentError) {
      setError(`添加评论失败: ${addCommentError.message}`);
      console.error("添加评论失败:", addCommentError);
    }
  }, [isAddCommentSuccess, addCommentError, selectedRecordIdForComments, address, lastSubmittedCommentContent]);

  useEffect(() => {
    if (isSuccess) {
      setSubmitSuccess(true);
      setError(null);
      const startTimestamp = getThreeDaysAgoTimestamp();
      const endTimestamp = getNowTimestamp();
      setCurrentSearchArgs([startTimestamp, endTimestamp, "", "0x0000000000000000000000000000000000000000" as `0x${string}`]);
    }
    if (isError && writeError) {
      setError(`提交失败: ${writeError.message}`);
      console.error("提交历史记录失败:", writeError);
    }
  }, [isSuccess, isError, writeError]);

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = (searchFilters.startTime || searchFilters.endTime || searchFilters.author || searchFilters.content || categorySearchInput || tagSearchInput)
    ? searchResults.slice(indexOfFirstRecord, indexOfLastRecord)
    : defaultSearchRecords.slice(indexOfFirstRecord, indexOfLastRecord);

  const totalPages = Math.ceil(((searchFilters.startTime || searchFilters.endTime || searchFilters.author || searchFilters.content || categorySearchInput || tagSearchInput) ? searchResults.length : defaultSearchRecords.length) / recordsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const copyAddress = (address: string) => {
    try {
      const input = document.createElement('input');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      input.value = address;
      document.body.appendChild(input);
      
      input.select();
      input.setSelectionRange(0, 99999);
      document.execCommand('copy');
      
      document.body.removeChild(input);
      
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    const startTimestamp = searchFilters.startTime ? Math.floor(new Date(searchFilters.startTime).getTime() / 1000) : 0;
    const endTimestamp = searchFilters.endTime ? Math.floor(new Date(searchFilters.endTime).getTime() / 1000) : Math.floor(Date.now() / 1000);
    const author = searchFilters.author && searchFilters.author.length === 42 ? searchFilters.author as `0x${string}` : "0x0000000000000000000000000000000000000000" as `0x${string}`;
    const keyword = searchFilters.content || "";

    setCurrentSearchArgs([BigInt(startTimestamp), BigInt(endTimestamp), keyword, author]);
    setCurrentPage(1);
    setCategoryRecords([]);
    setTagRecords([]);
    setCategorySearchInput('');
    setTagSearchInput('');
  };

  const handleInputChange = (field: keyof SearchFilters, value: string) => {
    setSearchFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleResetSearch = () => {
    setSearchFilters({
      startTime: '',
      endTime: '',
      author: '',
      content: ''
    });
    setSearchResults([]);
    setCurrentSearchArgs([BigInt(0), BigInt(0), "", "0x0000000000000000000000000000000000000000" as `0x${string}`]);
    setCurrentPage(1);
    setCategoryRecords([]);
    setTagRecords([]);
    setCategorySearchInput('');
    setTagSearchInput('');

    const startTimestamp = getThreeDaysAgoTimestamp();
    const endTimestamp = getNowTimestamp();
    setCurrentSearchArgs([startTimestamp, endTimestamp, "", "0x0000000000000000000000000000000000000000" as `0x${string}`]);
  };

  const handleCategorySearch = () => {
    setIsCategorySearching(true);
    setCurrentCategorySearchTerm(categorySearchInput.trim() || '');
    setSearchResults([]);
    setCurrentSearchArgs([BigInt(0), BigInt(0), "", "0x0000000000000000000000000000000000000000" as `0x${string}`]);
    setTagRecords([]);
    setCurrentTagSearchTerm('');
    setCurrentPage(1);
    setSearchFilters({
        startTime: '',
        endTime: '',
        author: '',
        content: ''
    });
  };

  const handleTagSearch = () => {
    setIsTagSearching(true);
    setCurrentTagSearchTerm(tagSearchInput.trim() || '');
    setSearchResults([]);
    setCurrentSearchArgs([BigInt(0), BigInt(0), "", "0x0000000000000000000000000000000000000000" as `0x${string}`]);
    setCategoryRecords([]);
    setCurrentCategorySearchTerm('');
    setCurrentPage(1);
    setSearchFilters({
        startTime: '',
        endTime: '',
        author: '',
        content: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!content.trim()) return;
    if (!address) {
      setError('请先连接钱包');
      return;
    }

    try {
      console.log('准备发送交易...', {
        address: HISTORY_CONTRACT_ADDRESS,
        content,
        tags,
        category,
        userAddress: address
      });

      await writeContract({
        address: HISTORY_CONTRACT_ADDRESS as `0x${string}`,
        abi: HISTORY_ABI,
        functionName: 'createRecord',
        args: [content, tags, category],
      });

      console.log('交易已发送');
      setContent('');
      setTags([]);
      setCategory('');
    } catch (err) {
      console.error('交易发送失败:', err);
      setError(err instanceof Error ? err.message : '交易发送失败');
    }
  };

  const handleAddComment = async (recordId: bigint) => {
    if (!commentContent.trim()) return;
    if (!address) {
      setError('请先连接钱包');
      return;
    }

    setIsAddingComment(true);
    setLastSubmittedCommentContent(commentContent);
    try {
      await addCommentWriteContract({
        address: HISTORY_CONTRACT_ADDRESS as `0x${string}`,
        abi: HISTORY_ABI,
        functionName: 'addComment',
        args: [recordId, commentContent],
      });
      setCommentContent('');
    } catch (err) {
      console.error('添加评论失败:', err);
      setError(err instanceof Error ? err.message : '添加评论失败');
    } finally {
      setIsAddingComment(false);
    }
  };

  const getThreeDaysAgoTimestamp = () => {
    const now = new Date();
    const threeDaysAgo = new Date(now.setDate(now.getDate() - 3));
    return BigInt(Math.floor(threeDaysAgo.getTime() / 1000));
  };

  const getNowTimestamp = () => {
    return BigInt(Math.floor(Date.now() / 1000));
  };

  const getTenMinutesAgoTimestamp = () => {
    const now = new Date();
    const tenMinutesAgo = new Date(now.setMinutes(now.getMinutes() - 10));
    return BigInt(Math.floor(tenMinutesAgo.getTime() / 1000));
  };

  const handleRefresh = () => {
    setIsDefaultSearching(true);
    const startTimestamp = getTenMinutesAgoTimestamp();
    const endTimestamp = getNowTimestamp();
    console.log(`刷新搜索：从 ${new Date(Number(startTimestamp) * 1000).toLocaleString()} 到 ${new Date(Number(endTimestamp) * 1000).toLocaleString()}`);
    
    setCurrentSearchArgs([startTimestamp, endTimestamp, "", "0x0000000000000000000000000000000000000000" as `0x${string}`]);
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchResults, defaultSearchRecords, categorySearchInput, tagSearchInput, searchFilters]);

  const toggleRecordExpand = (id: bigint) => {
    setExpandedRecords(prev => ({ ...prev, [id.toString()]: !prev[id.toString()] }));
  };

  // SEO 文案
  const seo = {
    zh: {
      title: 'Trash Talk - 去中心化自由发声历史平台',
      description: 'Trash Talk 是一个基于区块链的去中心化历史平台，强调言论自由、内容不可篡改，记录每个人的声音，见证时代的变迁。',
      keywords: 'Trash Talk, 区块链, 历史, 言论自由, 不可篡改, 去中心化, 记录, 宏大叙事',
    },
    en: {
      title: 'Trash Talk - Decentralized Free Speech History Platform',
      description: 'Trash Talk is a decentralized blockchain-based history platform, emphasizing freedom of speech, immutability, and recording every voice to witness the changes of the era.',
      keywords: 'Trash Talk, blockchain, history, free speech, immutable, decentralized, record, grand narrative',
    }
  };

  // 帮助内容
  const helpContent = {
    zh: `
1. 注册区块链钱包\n\n推荐钱包：MetaMask（小狐狸）\n- 访问 https://metamask.io/ 并下载安装浏览器插件或手机App。\n- 安装后，点击插件图标，按提示创建新钱包，务必妥善保存助记词，不要泄露给任何人。\n- 创建完成后，你会获得一个以 0x 开头的以太坊地址，这就是你的区块链身份。\n\n2. 领取测试网ETH（Sepolia）\n- 访问 https://sepoliafaucet.com/ 或 Alchemy Sepolia Faucet。\n- 粘贴你的钱包地址，点击领取（Claim）。\n- 等待几分钟，ETH到账后即可在 Trash Talk 平台体验发言、评论等功能。\n`,
    en: `
1. Register a Blockchain Wallet\n\nRecommended: MetaMask\n- Visit https://metamask.io/ and install the browser extension or mobile app.\n- After installation, click the extension icon and follow the instructions to create a new wallet. Be sure to back up your seed phrase securely and never share it with anyone.\n- Once created, you will get an Ethereum address starting with 0x, which is your blockchain identity.\n\n2. Get Sepolia Testnet ETH\n- Visit https://sepoliafaucet.com/ or Alchemy Sepolia Faucet.\n- Paste your wallet address as prompted and click "Claim".\n- Wait a few minutes for the ETH to arrive, then you can use all features on Trash Talk, including posting and commenting.\n`
  };

  // 帮助中心弹窗状态
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <Head>
        <title>{seo[lang].title}</title>
        <meta name="description" content={seo[lang].description} />
        <meta name="keywords" content={seo[lang].keywords} />
        <meta property="og:title" content={seo[lang].title} />
        <meta property="og:description" content={seo[lang].description} />
      </Head>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center py-10 px-4">
        <div className="w-full max-w-4xl bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 space-y-8 relative">
          {/* 语言切换按钮 */}
          <div className="absolute top-6 right-8 z-10">
            <button
              onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded shadow hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
            >
              {lang === 'zh' ? 'English' : '中文'}
            </button>
          </div>
          <h1 className="text-4xl font-bold text-center text-indigo-600 dark:text-indigo-400 mb-8">{texts[lang].title}</h1>
          <div className="flex justify-center mb-6">
            {<WalletConnect />}
          </div>

          {isConnected && (
            <div className="space-y-6">
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-300"
                >
                  {showCreateForm ? texts[lang].hideWrite : texts[lang].write}
                </button>
                <button
                  onClick={() => setShowSearchSection(!showSearchSection)}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition duration-300"
                >
                  {showSearchSection ? texts[lang].hideSearch : texts[lang].search}
                </button>
              </div>

              {showCreateForm && (
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-inner">
                  <h2 className="text-2xl font-semibold mb-4 text-center">{texts[lang].write}</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{texts[lang].content}:</label>
                      <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={texts[lang].placeholderContent}
                        rows={5}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 p-2"
                      ></textarea>
                    </div>
                    <div>
                      <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{texts[lang].tags}:</label>
                      <input
                        type="text"
                        id="tags"
                        value={tags.join(',')}
                        onChange={(e) => setTags(e.target.value.split(',').map(tag => tag.trim()))}
                        placeholder={texts[lang].placeholderTags}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 p-2"
                      />
                    </div>
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{texts[lang].category}:</label>
                      <input
                        type="text"
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder={texts[lang].placeholderCategory}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 p-2"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isCreating || !isConnected}
                      className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreating ? texts[lang].submitting : texts[lang].submit}
                    </button>
                    {submitSuccess && <p className="text-green-600 text-center mt-2">{texts[lang].submitSuccess}</p>}
                    {error && <p className="text-red-600 text-center mt-2">{texts[lang].error}: {error}</p>}
                  </form>
                </div>
              )}

              {showSearchSection && (
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg shadow-inner">
                  <h2 className="text-xl font-semibold mb-2 text-center">{texts[lang].search}</h2>
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <label htmlFor="search-start-time" className="block text-xs font-medium text-gray-700 dark:text-gray-300">{texts[lang].startTime}:</label>
                        <input
                          type="datetime-local"
                          id="search-start-time"
                          value={searchFilters.startTime}
                          onChange={(e) => handleInputChange('startTime', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 p-1 text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="search-end-time" className="block text-xs font-medium text-gray-700 dark:text-gray-300">{texts[lang].endTime}:</label>
                        <input
                          type="datetime-local"
                          id="search-end-time"
                          value={searchFilters.endTime}
                          onChange={(e) => handleInputChange('endTime', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 p-1 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="search-author" className="block text-xs font-medium text-gray-700 dark:text-gray-300">{texts[lang].author}:</label>
                      <input
                        type="text"
                        id="search-author"
                        value={searchFilters.author}
                        onChange={(e) => handleInputChange('author', e.target.value)}
                        placeholder={texts[lang].placeholderAuthor}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 p-1 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="search-content" className="block text-xs font-medium text-gray-700 dark:text-gray-300">{texts[lang].keyword}:</label>
                      <input
                        type="text"
                        id="search-content"
                        value={searchFilters.content}
                        onChange={(e) => handleInputChange('content', e.target.value)}
                        placeholder={texts[lang].placeholderKeyword}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 p-1 text-sm"
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-1">
                      <button
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {isSearching ? texts[lang].searching : texts[lang].searchBtn}
                      </button>
                      <button
                        onClick={handleResetSearch}
                        className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-md shadow-md transition duration-300 text-sm"
                      >
                        {texts[lang].reset}
                      </button>
                    </div>

                    <div className="mt-2 bg-gray-100 dark:bg-gray-600 p-2 rounded-lg">
                      <h3 className="text-base font-semibold mb-1">{texts[lang].categorySearch}:</h3>
                      <div className="flex gap-1 mb-2">
                        <input
                          type="text"
                          value={categorySearchInput}
                          onChange={(e) => setCategorySearchInput(e.target.value)}
                          placeholder={texts[lang].placeholderCategorySearch}
                          className="flex-grow rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-1 text-sm"
                        />
                        <button
                          onClick={handleCategorySearch}
                          disabled={isCategorySearching}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          {isCategorySearching ? texts[lang].searching : texts[lang].searchCategory}
                        </button>
                      </div>
                      {categoryRecords.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1">{texts[lang].categoryResult}:</h4>
                          <ul className="list-disc pl-4 space-y-1">
                            {categoryRecords.map((record) => (
                              <li key={record.id.toString()} className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow">
                                <p><strong>内容:</strong> {record.content}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400"><strong>作者:</strong> <span onClick={() => copyAddress(record.author)} className="cursor-pointer hover:underline">{record.author}</span> {copiedAddress === record.author && <span className="text-green-500 ml-2">{texts[lang].copy}</span>}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400"><strong>时间:</strong> {formatDate(record.timestamp)}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400"><strong>标签:</strong> {record.tags.join(', ')}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400"><strong>分类:</strong> {record.category}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="mt-2 bg-gray-100 dark:bg-gray-600 p-2 rounded-lg">
                      <h3 className="text-base font-semibold mb-1">{texts[lang].tagSearch}:</h3>
                      <div className="flex gap-1 mb-2">
                        <input
                          type="text"
                          value={tagSearchInput}
                          onChange={(e) => setTagSearchInput(e.target.value)}
                          placeholder={texts[lang].placeholderTagSearch}
                          className="flex-grow rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-1 text-sm"
                        />
                        <button
                          onClick={handleTagSearch}
                          disabled={isTagSearching}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          {isTagSearching ? texts[lang].searching : texts[lang].searchTag}
                        </button>
                      </div>
                      {tagRecords.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1">{texts[lang].tagResult}:</h4>
                          <ul className="list-disc pl-4 space-y-1">
                            {tagRecords.map((record) => (
                              <li key={record.id.toString()} className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow">
                                <p><strong>内容:</strong> {record.content}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400"><strong>作者:</strong> <span onClick={() => copyAddress(record.author)} className="cursor-pointer hover:underline">{record.author}</span> {copiedAddress === record.author && <span className="text-green-500 ml-2">{texts[lang].copy}</span>}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400"><strong>时间:</strong> {formatDate(record.timestamp)}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400"><strong>标签:</strong> {record.tags.join(', ')}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400"><strong>分类:</strong> {record.category}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{texts[lang].records}</h2>
              {isConnected && (
                <button
                  onClick={() => {
                    setIsDefaultSearching(true);
                    const startTimestamp = getThreeDaysAgoTimestamp();
                    const endTimestamp = getNowTimestamp();
                    setCurrentSearchArgs([startTimestamp, endTimestamp, "", "0x0000000000000000000000000000000000000000" as `0x${string}`]);
                    setCurrentPage(1);
                  }}
                  disabled={isDefaultSearching}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  {isDefaultSearching ? texts[lang].refreshing : texts[lang].recent3days}
                </button>
              )}
            </div>
            
            {isDefaultSearching && defaultSearchRecords.length === 0 && (
              <p className="text-center text-gray-600 dark:text-gray-400">{texts[lang].loading}</p>
            )}

            {!isDefaultSearching && defaultSearchRecords.length === 0 && (
              <p className="text-center text-gray-600 dark:text-gray-400">{texts[lang].noRecent}</p>
            )}

            {(isSearching || isCategorySearching || isTagSearching) && (searchResults.length === 0 && categoryRecords.length === 0 && tagRecords.length === 0) && (
              <p className="text-center text-gray-600 dark:text-gray-400">{texts[lang].loadingSearch}</p>
            )}

            {!(isSearching || isCategorySearching || isTagSearching || isDefaultSearching) && (searchResults.length === 0 && categoryRecords.length === 0 && tagRecords.length === 0 && defaultSearchRecords.length === 0) && (
              <p className="text-center text-gray-600 dark:text-gray-400">{texts[lang].noResult}</p>
            )}

            {currentRecords.length > 0 && (
              <>
                <div className="space-y-6">
                  {currentRecords.map((record) => {
                    const isLong = record.content.length > 120;
                    const isExpanded = expandedRecords[record.id.toString()];
                    return (
                      <div
                        key={record.id.toString()}
                        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
                      >
                        <p className="text-lg mb-2 break-all">
                          {isLong && !isExpanded
                            ? record.content.slice(0, 120) + '... '
                            : record.content}
                          {isLong && (
                            <button
                              className="text-blue-500 ml-2 text-sm underline focus:outline-none"
                              onClick={() => toggleRecordExpand(record.id)}
                            >
                              {isExpanded ? texts[lang].collapse : texts[lang].expand}
                            </button>
                          )}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400"><strong>作者:</strong> <span onClick={() => copyAddress(record.author)} className="cursor-pointer hover:underline">{record.author}</span> {copiedAddress === record.author && <span className="text-green-500 ml-2">{texts[lang].copy}</span>}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400"><strong>时间:</strong> {formatDate(record.timestamp)}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400"><strong>标签:</strong> {record.tags.join(', ')}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400"><strong>分类:</strong> {record.category}</p>

                        <div className="mt-4">
                          <button
                            onClick={() => setSelectedRecordIdForComments(selectedRecordIdForComments === record.id ? null : record.id)}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-300"
                          >
                            {selectedRecordIdForComments === record.id ? texts[lang].hideComment : texts[lang].showComment}
                          </button>
                        </div>

                        {selectedRecordIdForComments === record.id && (
                          <div className="mt-4 bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                            <h4 className="text-lg font-semibold mb-2">{texts[lang].comment}:</h4>
                            {isCommentsFetching && <p>{texts[lang].loading}</p>}
                            {comments.length === 0 && !isCommentsFetching && <p>{texts[lang].noComment}</p>}
                            <ul className="space-y-2 mb-4">
                              {comments.map((comment) => {
                                const isLongComment = comment.content.length > 80;
                                const isExpandedComment = false;
                                return (
                                  <li key={comment.id.toString()} className="bg-white dark:bg-gray-600 p-3 rounded-lg shadow-sm">
                                    <p className="text-sm break-words max-w-full overflow-hidden">
                                      {isLongComment && !isExpandedComment
                                        ? comment.content.slice(0, 80) + '... '
                                        : comment.content}
                                      {isLongComment && (
                                        <button
                                          className="text-blue-500 ml-2 text-xs underline focus:outline-none"
                                          onClick={() => !isExpandedComment}
                                        >
                                          {isExpandedComment ? texts[lang].collapse : texts[lang].expand}
                                        </button>
                                      )}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-300">由 <span onClick={() => copyAddress(comment.author)} className="cursor-pointer hover:underline">{comment.author}</span> 于 {formatDate(comment.timestamp)}</p>
                                  </li>
                                );
                              })}
                            </ul>
                            <div className="flex flex-col gap-2">
                              <textarea
                                value={commentContent}
                                onChange={(e) => setCommentContent(e.target.value)}
                                placeholder={texts[lang].placeholderComment}
                                rows={2}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-200 dark:bg-gray-500 text-gray-900 dark:text-gray-100 p-2"
                              ></textarea>
                              <button
                                onClick={() => handleAddComment(record.id)}
                                disabled={isAddingComment || !isConnected}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isAddingComment ? texts[lang].addingComment : texts[lang].addComment}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-center items-center mt-6 space-x-4">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-md shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {texts[lang].prev}
                  </button>
                  <span className="text-gray-700 dark:text-gray-300">{texts[lang].page} {currentPage} / {totalPages}</span>
                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-md shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {texts[lang].next}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {/* 帮助中心按钮和弹窗 */}
      <button
        className="fixed top-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg w-12 h-12 flex items-center justify-center text-2xl focus:outline-none"
        onClick={() => setShowHelp(true)}
        aria-label="Help"
      >
        ?
      </button>
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-xl"
              onClick={() => setShowHelp(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4">{lang === 'zh' ? '新手指南' : 'Getting Started'}</h2>
            <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-100">{helpContent[lang]}</pre>
          </div>
        </div>
      )}
    </>
  );
}
