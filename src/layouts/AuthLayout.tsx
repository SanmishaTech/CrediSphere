import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { appName } from '@/config';
 
const AuthLayout = () => {
	const [isDarkMode, setIsDarkMode] = useState(() => {
		// Check localStorage first
		const savedTheme = localStorage.getItem("theme");
		if (savedTheme) {
			return savedTheme === "dark";
		}
		// If no saved preference, check system preference
		return window.matchMedia("(prefers-color-scheme: dark)").matches;
	});

	// Effect to sync dark mode state with HTML class
	useEffect(() => {
		document.documentElement.classList.toggle("dark", isDarkMode);
	}, [isDarkMode]);

	// Effect to listen for system preference changes
	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handleChange = (e: MediaQueryListEvent) => {
			if (!localStorage.getItem("theme")) {
				setIsDarkMode(e.matches);
			}
		};

		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, []);

	const toggleDarkMode = () => {
		const newDarkMode = !isDarkMode;
		setIsDarkMode(newDarkMode);
		localStorage.setItem("theme", newDarkMode ? "dark" : "light");
	};

	return (
		<div className='h-screen w-full bg-background'>
			 
			
			<div className='grid lg:grid-cols-2 h-full'>
				{/* Cover Image Section */}
				<div className='relative hidden lg:block'>
					<img
						src='https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=80'
						alt='Modern office workspace'
						className='absolute inset-0 h-full w-full object-cover'
					/>
					<div className='relative z-10 flex flex-col justify-end h-full p-12 text-white'>
						<div className='absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none'></div>
						<div className='relative space-y-4'>
							<h2 className='text-3xl font-bold leading-tight'>
								Welcome to {appName}
							</h2>
							<p className='text-lg text-white/90 leading-relaxed'>
								Streamline your workflow and boost productivity with our comprehensive management platform.
							</p>
						</div>
					</div>
				</div>
				{/* Form Section */}
				<div className='flex flex-col justify-center items-center p-8 lg:p-12 bg-background'>
					<Outlet />
				</div>
			</div>
		</div>
	);
};

export default AuthLayout;