"use client"

import ForgotPassword from "@/components/auth/forgotPassword"
import ResendVerification from "@/components/auth/resendVerification"
import SigninForm from "@/components/auth/signinForm"
import SignupForm from "@/components/auth/signupForm"
import { ModeToggle } from "@/components/general/modeToggle"
import MoreAbout from "@/components/general/moreAbout"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authClient } from "@/lib/auth-client"
import { TabsContent } from "@radix-ui/react-tabs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

type Tab = "signIn" | "signUp" | "verificationMsg" | "forgotPassword"

export default function Page() {
	const router = useRouter()
	const { data: session } = authClient.useSession()
	const [email, setEmail] = useState("")
	const [selectedTab, setSelectedTab] = useState<Tab>("signIn")

	useEffect(() => {
		if (session && session.user) {
			router.push("/projects")
		}
	}, [session, router])

	function openEmailVerificationTab(email: string) {
		setEmail(email)
		setSelectedTab("verificationMsg")
	}

	return (
		<div className='container mx-auto flex flex-col lg:flex-row w-full lg:h-dvh items-center gap-8 p-8'>
			<div className='flex-1 space-y-8'>
				<div className='space-y-4'>
					<p className='font-extrabold text-5xl text-center lg:text-7xl lg:text-left'>
						AsyncFL<span className='font-thin text-6xl lg:text-8xl'>‐</span>
						<span className='font-extralight'>Boards</span>
					</p>
					<p className='text-center lg:text-left'>
						Analytical Dashboards for Asynchronous Federated Learning
						Simulations.
					</p>
				</div>
				<div className='flex flex-col lg:flex-row items-center gap-4'>
					{/* <Button variant='secondary' className='border'>
						More about AsyncFL-Boards
					</Button> */}
					<MoreAbout />
					<ModeToggle />
				</div>
			</div>
			<div className='flex-1 w-full max-w-lg'>
				<Tabs
					value={selectedTab}
					onValueChange={(t) => setSelectedTab(t as Tab)}>
					{(selectedTab === "signIn" || selectedTab === "signUp") && (
						<TabsList className='mb-4 w-full'>
							<TabsTrigger value='signIn'>Sign In</TabsTrigger>
							<TabsTrigger value='signUp'>Sign Up</TabsTrigger>
						</TabsList>
					)}
					<TabsContent value='signIn'>
						<Card>
							<CardContent>
								<SigninForm
									openEmailVerificationTab={openEmailVerificationTab}
									openForgotPassword={() => setSelectedTab("forgotPassword")}
								/>
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent value='signUp'>
						<Card>
							<CardContent>
								<SignupForm
									openEmailVerificationTab={openEmailVerificationTab}
								/>
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent value='verificationMsg'>
						<Card>
							<CardContent>
								<ResendVerification email={email} />
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent value='forgotPassword'>
						<Card>
							<CardContent>
								<ForgotPassword
									openSignInTab={() => setSelectedTab("signIn")}
								/>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	)
}
