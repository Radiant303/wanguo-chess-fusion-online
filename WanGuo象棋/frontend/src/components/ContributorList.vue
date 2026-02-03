<template>
    <div class="contributor-container">
        <h1 class="title">✨ 贡献者列表</h1>
        <div class="grid">
            <div v-for="contributor in contributors" :key="contributor.name" class="card">
                <div class="avatar-droplet">
                    <div class="avatar-wrapper">
                        <img :src="contributor.avatar" :alt="contributor.name" class="avatar" />
                    </div>
                </div>
                <div class="info">
                    <h2 class="name">{{ contributor.name }}</h2>
                    <span class="role-badge">{{ contributor.role }}</span>
                    <p class="desc">{{ contributor.description }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import pineappleBunAvatar from '../assets/pineapple_bun.jpg';
import manmanAvatar from '../assets/manman.jpg';
import yufeiAvatar from '../assets/yufei.jpg';
import keleAvatar from '../assets/kele.jpg';
import sheijiaxiaohaiAvatar from '../assets/sheijiaxiaohai.jpg';
import guyingAvatar from '../assets/guying.jpg';
import abaoAvatar from '../assets/abao.jpg';
import wangyuanjingAvatar from '../assets/wangyuanjing.jpg';
// Simple SVG placeholder data URI for empty avatars
export default defineComponent({
    name: 'ContributorList',
    data() {
        return {
            contributors: [
                {
                    name: '菠萝面包',
                    role: '核心贡献者',
                    description: '投喂了8个棋子',
                    avatar: pineappleBunAvatar
                },
                {
                    name: '溪深时鱼肥',
                    role: '核心贡献者',
                    description: '提供了宝贵意见',
                    avatar: yufeiAvatar
                },
                {
                    name: '漫漫',
                    role: '核心贡献者',
                    description: '提供了宝贵意见',
                    avatar: manmanAvatar
                },
                {
                    name: '可乐',
                    role: '核心贡献者',
                    description: '提供了宝贵意见',
                    avatar: keleAvatar
                },
                {
                    name: '谁家小孩',
                    role: '核心贡献者',
                    description: '提供了宝贵意见',
                    avatar: sheijiaxiaohaiAvatar
                },
                {
                    name: '孤影',
                    role: '核心贡献者',
                    description: '提供了宝贵意见',
                    avatar: guyingAvatar
                },
                {
                    name: '阿宝',
                    role: '核心贡献者',
                    description: '提供了宝贵意见',
                    avatar: abaoAvatar
                },
                {
                    name: '望远镜',
                    role: '核心贡献者',
                    description: '提供了宝贵意见',
                    avatar: wangyuanjingAvatar
                },
            ]
        }
    }
})
</script>

<style scoped>
/* 页面基础布局 */
.contributor-container {
    padding: 4rem 5%;
    margin: 0 auto;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    min-height: 100vh;
    /* 低饱和度浅灰蓝 + 噪点纹理模拟 */
    background-color: #f0f7ff;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
    display: flex;
    flex-direction: column;
    align-items: center;
}

.title {
    text-align: center;
    font-size: 2.8rem;
    font-weight: 600;
    margin-bottom: 4rem;
    color: #1a202c;
    /* 深灰，移除阴影 */
    letter-spacing: -0.02em;
    animation: text-float 6s ease-in-out infinite;
}

.grid {
    display: grid;
    /* 网格最小宽度 320px */
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 3rem;
    justify-content: center;
    width: 100%;
    max-width: 1400px;
}

/* Card Style - Professional & Clean */
.card {
    background: #ffffff;
    border-radius: 20px;
    padding: 2.5rem 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
    /* 增加 1px 浅灰边框 */
    border: 1px solid #edf2f7;
    /* 柔和阴影 */
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
}

/* Avatar - Refined Liquid Effect */
.avatar-droplet {
    position: relative;
    width: 160px;
    height: 160px;
    margin-bottom: 2rem;
    display: flex;
    justify-content: center;
    align-items: center;

    /* 半透明白色 + 微蓝 tint */
    background: rgba(255, 255, 255, 0.85);
    background-color: rgba(150, 200, 255, 0.15);


    /* 核心液态动画 - 8s 循环 */
    animation: fluid-morph 8s linear infinite;
    transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);

    /* 阴影简化 */
    box-shadow:
        inset 0 4px 8px rgba(255, 255, 255, 0.9),
        inset -2px -2px 6px rgba(150, 200, 255, 0.2),
        0 4px 12px rgba(0, 0, 0, 0.08);
}

.avatar-wrapper {
    width: 100%;
    height: 100%;
    overflow: hidden;
    /* Wrapper follows the parent shape animation via inheritance or we apply the same animation */
    /* Since clip-path is complex to animate perfectly in sync with border-radius without JS or complex SVG, 
       we will use the border-radius inheritance trick if possible, or just apply the same animation to the inner wrapper 
       but `overflow: hidden` on a border-radius animated element fixes the content inside in most modern browsers. 
    */
    border-radius: inherit;
    /* Important: The parent .avatar-droplet has the border-radius animation. 
       Inheriting it here ensures the overflow clips correctly. */
    animation: inherit;

    display: flex;
    justify-content: center;
    align-items: center;
}

.avatar {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 1;
    transform: scale(1.02);
    /* Slight scale to prevent pixel bleeding edges */
}

/* Interaction Effects */
.card:hover .avatar-droplet {
    /* 液态容器缩放至 1.03 */
    transform: scale(1.03);
    box-shadow:
        inset 0 4px 12px rgba(255, 255, 255, 0.95),
        inset -2px -2px 8px rgba(130, 190, 255, 0.3),
        0 8px 20px rgba(0, 10, 40, 0.1);
}

.name {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
    color: #1a202c;
    margin-bottom: 0.5rem;
}

.role-badge {
    display: inline-block;
    font-size: 0.85rem;
    font-weight: 600;
    /* 浅蓝底色徽章 + 文字 */
    background-color: #e6f0ff;
    color: #4a6cf7;
    padding: 0.35rem 1rem;
    border-radius: 999px;
    margin-bottom: 1.25rem;
    letter-spacing: 0.5px;
}

.desc {
    font-size: 1rem;
    color: #718096;
    line-height: 1.7;
    margin: 0;
    max-width: 280px;
}

/* Dark Mode Adaptation */
@media (prefers-color-scheme: dark) {
    .contributor-container {
        /* 深灰蓝背景 */
        background-color: #1a233a;
        background-image: none;
        /* Reduce noise in dark mode if needed, or keep it subtle. White noise on dark might be too grainy. Let's remove it for clean dark look. */
    }

    .title {
        color: #f7fafc;
    }

    .card {
        /* Deep dark card */
        background: #2d3748;
        border-color: #4a5568;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    }

    .card:hover {
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
    }

    .name {
        color: #edf2f7;
    }

    .role-badge {
        background-color: #2c3e50;
        color: #63b3ed;
    }

    .desc {
        color: #a0aec0;
    }

    .avatar-droplet {
        background: rgba(255, 255, 255, 0.05);
        box-shadow:
            inset 0 2px 4px rgba(255, 255, 255, 0.1),
            0 4px 12px rgba(0, 0, 0, 0.3);
    }
}

/* Animations */
@keyframes text-float {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-2px);
    }

    /* 微浮动 */
}

@keyframes fluid-morph {
    0% {
        border-radius: 40% 60% 60% 40% / 40% 40% 60% 60%;
    }

    5% {
        border-radius: 42% 58% 61% 39% / 42% 39% 61% 58%;
    }

    10% {
        border-radius: 45% 55% 62% 38% / 45% 38% 62% 55%;
    }

    15% {
        border-radius: 49% 51% 62% 38% / 49% 38% 62% 51%;
    }

    20% {
        border-radius: 52% 48% 61% 39% / 52% 39% 61% 48%;
    }

    25% {
        border-radius: 58% 42% 60% 40% / 58% 40% 60% 42%;
    }

    30% {
        border-radius: 60% 40% 55% 45% / 60% 42% 58% 40%;
    }

    35% {
        border-radius: 62% 38% 50% 50% / 61% 48% 52% 39%;
    }

    40% {
        border-radius: 62% 38% 45% 55% / 61% 52% 48% 39%;
    }

    45% {
        border-radius: 60% 40% 42% 58% / 61% 58% 42% 39%;
    }

    50% {
        border-radius: 58% 42% 40% 60% / 58% 60% 40% 42%;
    }

    55% {
        border-radius: 52% 48% 40% 60% / 55% 61% 39% 45%;
    }

    60% {
        border-radius: 48% 52% 40% 60% / 52% 61% 39% 48%;
    }

    65% {
        border-radius: 44% 56% 41% 59% / 50% 61% 39% 50%;
    }

    70% {
        border-radius: 41% 59% 42% 58% / 48% 62% 38% 52%;
    }

    75% {
        border-radius: 40% 60% 45% 55% / 42% 60% 40% 58%;
    }

    80% {
        border-radius: 40% 60% 48% 52% / 40% 58% 42% 60%;
    }

    85% {
        border-radius: 40% 60% 50% 50% / 40% 52% 48% 60%;
    }

    90% {
        border-radius: 40% 60% 55% 45% / 40% 48% 52% 60%;
    }

    95% {
        border-radius: 40% 60% 58% 42% / 40% 42% 58% 60%;
    }

    100% {
        border-radius: 40% 60% 60% 40% / 40% 40% 60% 60%;
    }
}

/* Accessibility Focus */
button:focus-visible,
a:focus-visible,
.card:focus-visible {
    outline: 2px solid #4a6cf7;
    outline-offset: 4px;
}
</style>